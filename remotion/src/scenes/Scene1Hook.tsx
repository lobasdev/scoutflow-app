import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { grotesk, inter, colors } from "../theme";

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowO = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const eyebrowY = interpolate(spring({ frame: frame - 0, fps, config: { damping: 200 } }), [0, 1], [20, 0]);

  // Word-by-word reveal
  const words = ["Every", "observation,", "every", "match,"];
  const heroLine2 = ["one", "command", "center."];

  return (
    <AbsoluteFill style={{ padding: "0 160px", justifyContent: "center" }}>
      <div style={{ maxWidth: 1400 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            border: `1px solid ${colors.primary}66`,
            borderRadius: 999,
            background: `${colors.primary}1a`,
            fontFamily: inter,
            fontSize: 22,
            color: colors.primaryGlow,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: eyebrowO,
            transform: `translateY(${eyebrowY}px)`,
            marginBottom: 40,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: colors.primary }} />
          ScoutFlow
        </div>

        <div style={{ fontFamily: grotesk, fontWeight: 700, fontSize: 140, lineHeight: 1.05, color: colors.text, letterSpacing: -3 }}>
          <div>
            {words.map((w, i) => {
              const start = 10 + i * 6;
              const o = interpolate(frame, [start, start + 12], [0, 1], { extrapolateRight: "clamp" });
              const y = interpolate(spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 120 } }), [0, 1], [40, 0]);
              return (
                <span key={i} style={{ display: "inline-block", opacity: o, transform: `translateY(${y}px)`, marginRight: 24 }}>
                  {w}
                </span>
              );
            })}
          </div>
          <div>
            {heroLine2.map((w, i) => {
              const start = 40 + i * 6;
              const o = interpolate(frame, [start, start + 12], [0, 1], { extrapolateRight: "clamp" });
              const y = interpolate(spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 120 } }), [0, 1], [40, 0]);
              const isAccent = w === "command";
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    opacity: o,
                    transform: `translateY(${y}px)`,
                    marginRight: 24,
                    background: isAccent
                      ? `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`
                      : undefined,
                    WebkitBackgroundClip: isAccent ? "text" : undefined,
                    WebkitTextFillColor: isAccent ? "transparent" : undefined,
                    fontStyle: isAccent ? "italic" : undefined,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
