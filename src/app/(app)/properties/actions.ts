"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentCompany } from "@/lib/auth/current-company";
import { createClient } from "@/lib/supabase/server";
import { uploadPropertyMedia } from "@/lib/supabase/storage";
import { analyzeProperty, type ImageInput } from "@/lib/ai/analyze-property";
import type { ActionState } from "@/lib/action-state";
import { asAllowedImageType, extensionFor } from "./media";

const MAX_PHOTOS = 8;

export type PropertyFormState = { status: "idle" | "error"; message?: string };
const idlePropertyState: PropertyFormState = { status: "idle" };

async function fileToImageInput(file: File): Promise<{ input: ImageInput; bytes: Uint8Array }> {
  const type = asAllowedImageType(file.type);
  if (!type) {
    throw new Error(`対応していないファイル形式です: ${file.name}`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const base64 = Buffer.from(bytes).toString("base64");
  return { input: { base64, mediaType: type }, bytes };
}

export async function createProperty(
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const { company } = await requireCurrentCompany();

  const name = String(formData.get("name") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim() || null;
  const floorPlanFile = formData.get("floorPlan");
  const photoFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_PHOTOS);

  if (!name) return { status: "error", message: "物件名を入力してください" };
  if (!(floorPlanFile instanceof File) || floorPlanFile.size === 0) {
    return { status: "error", message: "間取り図をアップロードしてください" };
  }
  if (photoFiles.length === 0) {
    return { status: "error", message: "空室写真を1枚以上アップロードしてください" };
  }
  if (!asAllowedImageType(floorPlanFile.type) || photoFiles.some((f) => !asAllowedImageType(f.type))) {
    return { status: "error", message: "対応している画像形式はJPEG / PNG / WebPです" };
  }

  const supabase = await createClient();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert({ company_id: company.id, name, memo, status: "processing" })
    .select("id")
    .single();

  if (propertyError || !property) {
    return { status: "error", message: propertyError?.message ?? "物件の登録に失敗しました" };
  }

  let failure: string | null = null;
  let generationId: string | null = null;

  try {
    const floorPlan = await fileToImageInput(floorPlanFile);
    const photos = await Promise.all(photoFiles.map(fileToImageInput));

    const floorPlanPath = `${company.id}/${property.id}/floor-plan-${Date.now()}.${extensionFor(floorPlan.input.mediaType)}`;
    await uploadPropertyMedia(floorPlanPath, floorPlan.bytes, floorPlan.input.mediaType);

    const photoPaths = photos.map(
      (photo, i) => `${company.id}/${property.id}/photo-${i}-${Date.now()}.${extensionFor(photo.input.mediaType)}`
    );
    await Promise.all(
      photos.map((photo, i) => uploadPropertyMedia(photoPaths[i], photo.bytes, photo.input.mediaType))
    );

    await supabase.from("properties").update({ floor_plan_url: floorPlanPath }).eq("id", property.id);
    await supabase.from("property_photos").insert(
      photoPaths.map((path, i) => ({ property_id: property.id, url: path, sort_order: i }))
    );

    const { data: generation, error: generationError } = await supabase
      .from("generations")
      .insert({ property_id: property.id, status: "processing" })
      .select("id")
      .single();
    if (generationError || !generation) {
      throw new Error(generationError?.message ?? "生成記録の作成に失敗しました");
    }
    generationId = generation.id;

    const result = await analyzeProperty({
      propertyName: name,
      memo,
      floorPlan: floorPlan.input,
      photos: photos.map((p) => p.input),
    });

    const { error: proposalsError } = await supabase.from("proposals").insert(
      result.proposals.map((proposal) => ({
        generation_id: generation.id,
        property_id: property.id,
        pattern_key: proposal.patternKey,
        title: proposal.title,
        summary: proposal.summary,
        layout_data: { rooms: result.rooms, furniture: proposal.furniture },
      }))
    );
    if (proposalsError) throw new Error(proposalsError.message);

    await supabase
      .from("generations")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", generation.id);
    await supabase.from("properties").update({ status: "completed" }).eq("id", property.id);
  } catch (err) {
    failure = err instanceof Error ? err.message : "AI解析に失敗しました";
  }

  if (failure) {
    await supabase
      .from("properties")
      .update({ status: "failed", status_error: failure })
      .eq("id", property.id);
    if (generationId) {
      await supabase
        .from("generations")
        .update({ status: "failed", error_message: failure })
        .eq("id", generationId);
    }
  }

  revalidatePath("/dashboard");
  redirect(`/properties/${property.id}`);
}

export async function regenerateProposals(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { company } = await requireCurrentCompany();
  const propertyId = String(formData.get("propertyId") ?? "");
  if (!propertyId) return { status: "error", message: "物件が指定されていません" };

  const supabase = await createClient();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, company_id, name, memo, floor_plan_url")
    .eq("id", propertyId)
    .eq("company_id", company.id)
    .single();

  if (propertyError || !property || !property.floor_plan_url) {
    return { status: "error", message: "物件情報を取得できませんでした" };
  }

  const { data: photoRows } = await supabase
    .from("property_photos")
    .select("url")
    .eq("property_id", propertyId)
    .order("sort_order");

  if (!photoRows || photoRows.length === 0) {
    return { status: "error", message: "空室写真が見つかりませんでした" };
  }

  await supabase.from("properties").update({ status: "processing", status_error: null }).eq("id", propertyId);

  const admin = (await import("@/lib/supabase/admin")).createAdminClient();
  const { PROPERTY_MEDIA_BUCKET } = await import("@/lib/supabase/storage");

  async function downloadAsImageInput(path: string): Promise<ImageInput> {
    const { data, error } = await admin.storage.from(PROPERTY_MEDIA_BUCKET).download(path);
    if (error || !data) throw new Error(`画像の取得に失敗しました: ${path}`);
    const bytes = new Uint8Array(await data.arrayBuffer());
    const mediaType = asAllowedImageType(data.type) ?? "image/jpeg";
    return { base64: Buffer.from(bytes).toString("base64"), mediaType };
  }

  let failure: string | null = null;
  let generationId: string | null = null;

  try {
    const floorPlan = await downloadAsImageInput(property.floor_plan_url);
    const photos = await Promise.all(photoRows.map((row) => downloadAsImageInput(row.url)));

    const { data: generation, error: generationError } = await supabase
      .from("generations")
      .insert({ property_id: propertyId, status: "processing" })
      .select("id")
      .single();
    if (generationError || !generation) throw new Error(generationError?.message ?? "生成記録の作成に失敗しました");
    generationId = generation.id;

    const result = await analyzeProperty({
      propertyName: property.name,
      memo: property.memo,
      floorPlan,
      photos,
    });

    const { error: proposalsError } = await supabase.from("proposals").insert(
      result.proposals.map((proposal) => ({
        generation_id: generation.id,
        property_id: propertyId,
        pattern_key: proposal.patternKey,
        title: proposal.title,
        summary: proposal.summary,
        layout_data: { rooms: result.rooms, furniture: proposal.furniture },
      }))
    );
    if (proposalsError) throw new Error(proposalsError.message);

    await supabase
      .from("generations")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", generation.id);
    await supabase.from("properties").update({ status: "completed" }).eq("id", propertyId);
  } catch (err) {
    failure = err instanceof Error ? err.message : "AI解析に失敗しました";
  }

  if (failure) {
    await supabase.from("properties").update({ status: "failed", status_error: failure }).eq("id", propertyId);
    if (generationId) {
      await supabase
        .from("generations")
        .update({ status: "failed", error_message: failure })
        .eq("id", generationId);
    }
    revalidatePath(`/properties/${propertyId}`);
    return { status: "error", message: failure };
  }

  revalidatePath(`/properties/${propertyId}`);
  return { status: "success", message: "新しい提案を生成しました" };
}

export { idlePropertyState };
