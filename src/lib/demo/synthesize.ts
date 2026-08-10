import type { FurnitureItem, LayoutData, RoomShape } from "@/types/layout";

/**
 * Demo-mode stand-in for lib/ai/analyze-property.ts. Returns a fixed but
 * plausible room + furniture layout so the property-creation flow can be
 * demoed without a real Claude Vision call.
 */
export function synthesizeProposals(): {
  rooms: RoomShape[];
  proposals: { patternKey: string; title: string; summary: string; furniture: FurnitureItem[] }[];
} {
  const rooms: RoomShape[] = [
    {
      id: "living",
      name: "リビング・ダイニング",
      points: [
        { x: 0, y: 0 },
        { x: 5.2, y: 0 },
        { x: 5.2, y: 4.0 },
        { x: 0, y: 4.0 },
      ],
    },
    {
      id: "bedroom",
      name: "寝室",
      points: [
        { x: 5.4, y: 0 },
        { x: 8.6, y: 0 },
        { x: 8.6, y: 3.2 },
        { x: 5.4, y: 3.2 },
      ],
    },
  ];

  const proposals = [
    {
      patternKey: "A",
      title: "コンパクト向け",
      summary: "単身者向けに省スペースな配置にしています。（デモデータ）",
      furniture: [
        { id: "f1", roomId: "living", label: "ソファ", x: 0.3, y: 0.3, width: 1.8, depth: 0.8, rotation: 0 },
        { id: "f2", roomId: "living", label: "ローテーブル", x: 0.3, y: 1.4, width: 1.0, depth: 0.5, rotation: 0 },
        { id: "f3", roomId: "bedroom", label: "シングルベッド", x: 5.7, y: 0.3, width: 1.0, depth: 2.0, rotation: 0 },
      ],
    },
    {
      patternKey: "B",
      title: "ファミリー向け",
      summary: "ダイニングを広く取り、家族で過ごせる配置にしています。（デモデータ）",
      furniture: [
        { id: "f4", roomId: "living", label: "ダイニングテーブル", x: 0.3, y: 0.3, width: 1.6, depth: 0.9, rotation: 0 },
        { id: "f5", roomId: "living", label: "ソファ", x: 2.4, y: 2.6, width: 2.2, depth: 0.8, rotation: 0 },
        { id: "f6", roomId: "bedroom", label: "ダブルベッド", x: 5.6, y: 0.3, width: 1.4, depth: 2.0, rotation: 0 },
      ],
    },
    {
      patternKey: "C",
      title: "ワークスペース重視",
      summary: "在宅ワーク用のデスクスペースを確保しています。（デモデータ）",
      furniture: [
        { id: "f7", roomId: "living", label: "ソファ", x: 0.3, y: 2.8, width: 1.8, depth: 0.8, rotation: 0 },
        { id: "f8", roomId: "living", label: "ワークデスク", x: 3.4, y: 0.3, width: 1.4, depth: 0.6, rotation: 0 },
        { id: "f9", roomId: "bedroom", label: "シングルベッド", x: 5.7, y: 0.3, width: 1.0, depth: 2.0, rotation: 0 },
      ],
    },
  ];

  return { rooms, proposals };
}

export function layoutFor(rooms: RoomShape[], furniture: FurnitureItem[]): LayoutData {
  return { rooms, furniture };
}
