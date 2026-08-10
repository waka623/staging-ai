import { createAdminClient } from "@/lib/supabase/admin";

export const PROPERTY_MEDIA_BUCKET = "property-media";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * `properties.floor_plan_url` and `property_photos.url` store the storage
 * object *path*, not a durable URL — signed URLs expire, so they're minted
 * on read instead of persisted.
 */
export async function getSignedMediaUrl(path: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(PROPERTY_MEDIA_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}

export async function getSignedMediaUrls(paths: string[]): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(PROPERTY_MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  const map = new Map<string, string>();
  if (error || !data) return map;
  for (const item of data) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}

export async function uploadPropertyMedia(
  path: string,
  bytes: Uint8Array,
  contentType: string
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(PROPERTY_MEDIA_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });

  if (error) {
    throw new Error(`ファイルのアップロードに失敗しました: ${error.message}`);
  }
}
