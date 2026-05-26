import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { grotesk, inter, colors } from "../theme";

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSp = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const logoScale = interpolate(logoSp, [0, 1], [0.6, 1]);
  const logoO = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const taglineO = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: "clamp" });
  const taglineY = interpolate(spring({ frame: frame - 22, fps, config: { damping: 18 } }), [0, 1], [20, 0]);

  const subO = interpolate(frame, [38, 55], [0, 1], { extrapolateRight: "clamp" });
  const urlO = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp" });

  // Pulsing glow
  const pulse = 0.6 + Math.sin(frame / 8) * 0.2;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            opacity: logoO,
            transform: `scale(${logoScale})`,
            display: "inline-flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 50,
          }}
        >
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 60,
              boxShadow: `0 0 ${80 * pulse}px ${colors.primary}, 0 20px 60px -10px ${colors.secondary}`,
            }}
          >
            ✦
          </div>
          <div
            style={{
              fontFamily: grotesk,
              fontWeight: 700,
              fontSize: 120,
              letterSpacing: -3,
              background: `linear-gradient(90deg, ${colors.text}, ${colors.primaryGlow})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ScoutFlow
          </div>
        </div>

        <div
          style={{
            fontFamily: grotesk,
            fontSize: 70,
            fontWeight: 500,
            color: colors.text,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            opacity: taglineO,
            transform: `translateY(${taglineY}px)`,
            marginBottom: 32,
            maxWidth: 1200,
          }}
        >
          Your scouting <span style={{ fontStyle: "italic", background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>command center.</span>
        </div>

        <div
          style={{
            fontFamily: inter,
            fontSize: 26,
            color: colors.muted,
            opacity: subO,
            marginBottom: 60,
          }}
        >
          Start your 7-day free trial. Cancel anytime.
        </div>

        <div
          style={{
            opacity: urlO,
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            padding: "22px 44px",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
            fontFamily: grotesk,
            fontSize: 38,
            fontWeight: 700,
            color: colors.text,
            letterSpacing: 0.5,
            boxShadow: `0 20px 60px -10px ${colors.primary}`,
          }}
        >
          scoutflow.tech
          <span style={{ fontSize: 32 }}>→</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
