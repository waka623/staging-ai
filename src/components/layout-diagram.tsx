import type { LayoutData } from "@/types/layout";

const ROOM_FILL = "#f0f4f2";
const ROOM_STROKE = "#57645c";
const FURNITURE_FILL = "#ccebe4";
const FURNITURE_STROKE = "#0f766e";
const PADDING_M = 0.6;

function roomCentroid(points: { x: number; y: number }[]) {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function LayoutDiagram({ layout }: { layout: LayoutData }) {
  const allPoints = layout.rooms.flatMap((room) => room.points);
  if (allPoints.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-stone-300 text-sm text-stone-400">
        レイアウトデータがありません
      </div>
    );
  }

  const minX = Math.min(...allPoints.map((p) => p.x)) - PADDING_M;
  const minY = Math.min(...allPoints.map((p) => p.y)) - PADDING_M;
  const maxX = Math.max(...allPoints.map((p) => p.x)) + PADDING_M;
  const maxY = Math.max(...allPoints.map((p) => p.y)) + PADDING_M;
  const width = maxX - minX;
  const height = maxY - minY;

  return (
    <svg
      viewBox={`${minX} ${minY} ${width} ${height}`}
      className="h-auto w-full rounded-lg border border-stone-200 bg-white"
      role="img"
      aria-label="家具配置の俯瞰図"
    >
      {layout.rooms.map((room) => {
        const points = room.points.map((p) => `${p.x},${p.y}`).join(" ");
        const centroid = roomCentroid(room.points);
        return (
          <g key={room.id}>
            <polygon
              points={points}
              fill={ROOM_FILL}
              stroke={ROOM_STROKE}
              strokeWidth={0.04}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={centroid.x}
              y={centroid.y}
              fontSize={0.16}
              textAnchor="middle"
              fill={ROOM_STROKE}
              opacity={0.7}
            >
              {room.name}
            </text>
          </g>
        );
      })}

      {layout.furniture.map((item) => {
        const cx = item.x + item.width / 2;
        const cy = item.y + item.depth / 2;
        return (
          <g key={item.id} transform={`rotate(${item.rotation} ${cx} ${cy})`}>
            <rect
              x={item.x}
              y={item.y}
              width={item.width}
              height={item.depth}
              fill={FURNITURE_FILL}
              stroke={FURNITURE_STROKE}
              strokeWidth={0.03}
              rx={0.04}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={cx}
              y={cy}
              fontSize={0.12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={FURNITURE_STROKE}
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
