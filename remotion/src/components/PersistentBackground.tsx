import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "./theme";

export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / 30;
  return (
    <AbsoluteFill style={{ background: colors.bg, overflow: "hidden" }}>
      {/* Soft drifting radial gradients */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${30 + Math.sin(t * 0.3) * 15}% ${40 + Math.cos(t * 0.25) * 10}%, ${colors.primary}33 0%, transparent 45%), radial-gradient(circle at ${70 + Math.cos(t * 0.4) * 10}% ${65 + Math.sin(t * 0.35) * 12}%, ${colors.secondary}26 0%, transparent 50%)`,
        }}
      />
      {/* Grid */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: 0.06 }}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke={colors.text} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, transparent 50%, ${colors.bg} 100%)` }} />
    </AbsoluteFill>
  );
};
