import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { PersistentBackground } from "./components/PersistentBackground";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Players } from "./scenes/Scene2Players";
import { Scene3Observations } from "./scenes/Scene3Observations";
import { Scene4Features } from "./scenes/Scene4Features";
import { Scene5CTA } from "./scenes/Scene5CTA";

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={105}>
          <Scene1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 22 })} />

        <TransitionSeries.Sequence durationInFrames={135}>
          <Scene2Players />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 22 })} />

        <TransitionSeries.Sequence durationInFrames={135}>
          <Scene3Observations />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 22 })} />

        <TransitionSeries.Sequence durationInFrames={135}>
          <Scene4Features />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 18 })} />

        <TransitionSeries.Sequence durationInFrames={140}>
          <Scene5CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
