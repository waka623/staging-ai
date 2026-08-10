/**
 * Structured layout data returned by the AI analysis (lib/ai/analyze-property.ts)
 * and stored as `proposals.layout_data`. The overhead SVG renderer (Phase 1) and
 * the future 3D renderer (Phase 3) both read this same document, so it carries
 * real-world units (meters) rather than pixels.
 */
export type RoomShape = {
  id: string;
  name: string;
  /** Polygon points in meters, clockwise, room-local coordinate space. */
  points: { x: number; y: number }[];
};

export type FurnitureItem = {
  id: string;
  roomId: string;
  label: string;
  /** Top-left corner of the furniture's bounding box, in meters. */
  x: number;
  y: number;
  width: number;
  depth: number;
  /** Rotation in degrees, clockwise. */
  rotation: number;
};

export type LayoutData = {
  rooms: RoomShape[];
  furniture: FurnitureItem[];
};
