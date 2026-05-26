import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { grotesk, inter, colors } from "../theme";

const features = [
  { icon: "🏆", title: "Tournament Tracking", desc: "Schedule trips, track matches and players in one place." },
  { icon: "📊", title: "Team Analysis", desc: "Tactical breakdowns and squad-level opposition reports." },
  { icon: "📄", title: "PDF Reports", desc: "Generate share-ready scouting documents in one click." },
  { icon: "👥", title: "Chief Scout Oversight", desc: "Assign, review, and feedback across your scouting team." },
];

export const Scene4Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleO = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ padding: "100px 140px", justifyContent: "center" }}>
      <div style={{ opacity: titleO, marginBottom: 50 }}>
        <div style={{ fontFamily: inter, fontSize: 22, color: colors.accent, letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
          03 — A Full Scouting Suite
        </div>
        <div style={{ fontFamily: grotesk, fontSize: 92, fontWeight: 700, color: colors.text, lineHeight: 1, letterSpacing: -2 }}>
          From <span style={{ fontStyle: "italic", background: `linear-gradient(90deg, ${colors.accent}, ${colors.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>match day</span> to report.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 28 }}>
        {features.map((f, i) => {
          const start = 12 + i * 9;
          const sp = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 140 } });
          const o = interpolate(sp, [0, 1], [0, 1]);
          const y = interpolate(sp, [0, 1], [50, 0]);
          return (
            <div
              key={f.title}
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 24,
                padding: 36,
                opacity: o,
                transform: `translateY(${y}px)`,
                display: "flex",
                gap: 24,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  flexShrink: 0,
                  boxShadow: `0 10px 30px -10px ${colors.primary}`,
                }}
              >
                {f.icon}
              </div>
              <div>
                <div style={{ fontFamily: grotesk, fontSize: 36, fontWeight: 700, color: colors.text, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontFamily: inter, fontSize: 22, color: colors.muted, lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
