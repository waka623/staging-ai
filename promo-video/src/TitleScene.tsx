import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const TitleScene: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // スプリングアニメーションによる滑らかな拡大イン
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 100 },
  });

  // 60〜75フレームの間でフェードアウト
  const opacity = interpolate(frame, [0, 15, 60, 75], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-slate-950 items-center justify-center flex flex-col text-white">
      <h1
        style={{ transform: `scale(${scale})`, opacity }}
        className="text-6xl font-bold tracking-tight text-cyan-400"
      >
        {title}
      </h1>
      <p style={{ opacity }} className="text-2xl mt-4 text-slate-300">
        {subtitle}
      </p>
    </AbsoluteFill>
  );
};
