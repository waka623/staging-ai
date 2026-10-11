import "./index.css";
import { Composition } from "remotion";
import { TitleScene } from "./TitleScene";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TitleScene"
      component={TitleScene}
      durationInFrames={75}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{ title: "Promo Video", subtitle: "Made with Remotion" }}
    />
  );
};
