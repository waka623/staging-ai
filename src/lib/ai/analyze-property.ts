import Anthropic from "@anthropic-ai/sdk";
import type { FurnitureItem, RoomShape } from "@/types/layout";

export type ImageInput = {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
};

export type ProposalDraft = {
  patternKey: string;
  title: string;
  summary: string;
  furniture: FurnitureItem[];
};

export type AnalyzeResult = {
  rooms: RoomShape[];
  proposals: ProposalDraft[];
};

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

// JSON Schema for the forced tool call. Hand-written (not zod-derived) since
// the Anthropic tool-use API takes a plain JSON Schema, and this is the only
// place that needs it.
const PROPOSE_LAYOUTS_SCHEMA = {
  type: "object",
  required: ["rooms", "proposals"],
  properties: {
    rooms: {
      type: "array",
      description:
        "The rooms read off the floor plan, in meters, room-local coordinates.",
      items: {
        type: "object",
        required: ["id", "name", "points"],
        properties: {
          id: { type: "string" },
          name: { type: "string", description: "e.g. リビング, 寝室, キッチン" },
          points: {
            type: "array",
            description: "Polygon corners in meters, clockwise, at least 3 points.",
            items: {
              type: "object",
              required: ["x", "y"],
              properties: { x: { type: "number" }, y: { type: "number" } },
            },
          },
        },
      },
    },
    proposals: {
      type: "array",
      description: "Exactly 3 distinct furniture-layout patterns for the same rooms.",
      items: {
        type: "object",
        required: ["pattern_key", "title", "summary", "furniture"],
        properties: {
          pattern_key: { type: "string", enum: ["A", "B", "C"] },
          title: { type: "string", description: "e.g. コンパクト向け, ファミリー向け, ワークスペース重視" },
          summary: { type: "string", description: "1-2 sentence rationale for this layout, in Japanese." },
          furniture: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "room_id", "label", "x", "y", "width", "depth", "rotation"],
              properties: {
                id: { type: "string" },
                room_id: { type: "string", description: "Must match a rooms[].id" },
                label: { type: "string", description: "e.g. ソファ, ダブルベッド, ダイニングテーブル" },
                x: { type: "number", description: "meters, top-left of bounding box, room-local" },
                y: { type: "number", description: "meters, top-left of bounding box, room-local" },
                width: { type: "number", description: "meters" },
                depth: { type: "number", description: "meters" },
                rotation: { type: "number", description: "degrees clockwise" },
              },
            },
          },
        },
      },
    },
  },
} satisfies Anthropic.Tool.InputSchema;

const SYSTEM_PROMPT = `あなたは不動産の空室バーチャルステージングを行うインテリアプランナーです。
間取り図と空室の写真から、部屋の形状（メートル単位）を読み取り、家具配置プランを3パターン（コンパクト向け／ファミリー向け／ワークスペース重視など、部屋の用途に応じて適切なテーマ）提案してください。
- 各部屋の寸法は間取り図の畳数・帖数表記や一般的な部屋サイズの相場から妥当な値を推定してください。
- 家具同士が重ならないよう、通路の動線も考慮してください。
- 出力は必ず propose_layouts ツールの呼び出しのみで行い、それ以外のテキストは出力しないでください。`;

function buildImageBlock(image: ImageInput): Anthropic.ImageBlockParam {
  return {
    type: "image",
    source: { type: "base64", media_type: image.mediaType, data: image.base64 },
  };
}

export async function analyzeProperty({
  propertyName,
  memo,
  floorPlan,
  photos,
}: {
  propertyName: string;
  memo?: string | null;
  floorPlan: ImageInput;
  photos: ImageInput[];
}): Promise<AnalyzeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません");
  }

  const client = new Anthropic({ apiKey });

  const promptLines = [
    `物件名: ${propertyName}`,
    memo ? `メモ: ${memo}` : null,
    "1枚目の画像は間取り図です。2枚目以降は空室の写真です。",
  ].filter(Boolean);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "propose_layouts",
        description: "間取りの部屋データと、3パターンの家具配置プランを返す",
        input_schema: PROPOSE_LAYOUTS_SCHEMA,
      },
    ],
    tool_choice: { type: "tool", name: "propose_layouts" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: promptLines.join("\n") },
          buildImageBlock(floorPlan),
          ...photos.map(buildImageBlock),
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("AIからレイアウト提案を取得できませんでした");
  }

  const input = toolUse.input as {
    rooms: { id: string; name: string; points: { x: number; y: number }[] }[];
    proposals: {
      pattern_key: string;
      title: string;
      summary: string;
      furniture: {
        id: string;
        room_id: string;
        label: string;
        x: number;
        y: number;
        width: number;
        depth: number;
        rotation: number;
      }[];
    }[];
  };

  if (!input?.rooms?.length || !input?.proposals?.length) {
    throw new Error("AIの応答が不完全です");
  }

  const rooms: RoomShape[] = input.rooms.map((room) => ({
    id: room.id,
    name: room.name,
    points: room.points,
  }));

  const proposals: ProposalDraft[] = input.proposals.map((proposal) => ({
    patternKey: proposal.pattern_key,
    title: proposal.title,
    summary: proposal.summary,
    furniture: proposal.furniture.map((item) => ({
      id: item.id,
      roomId: item.room_id,
      label: item.label,
      x: item.x,
      y: item.y,
      width: item.width,
      depth: item.depth,
      rotation: item.rotation,
    })),
  }));

  return { rooms, proposals };
}
