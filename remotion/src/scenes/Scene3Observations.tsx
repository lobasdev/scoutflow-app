import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { grotesk, inter, colors } from "../theme";

const skills = [
  { label: "Pace", val: 88 },
  { label: "Finishing", val: 84 },
  { label: "Vision", val: 79 },
  { label: "Dribbling", val: 91 },
  { label: "Strength", val: 72 },
  { label: "Positioning", val: 86 },
];

export const Scene3Observations: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleO = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const cardSp = spring({ frame: frame - 8, fps, config: { damping: 18 } });

  // Radar chart points
  const cx = 280, cy = 280, r = 200;
  const angles = skills.map((_, i) => (Math.PI * 2 * i) / skills.length - Math.PI / 2);
  const points = skills.map((s, i) => {
    const reveal = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
    const rad = (s.val / 100) * r * reveal;
    return [cx + Math.cos(angles[i]) * rad, cy + Math.sin(angles[i]) * rad];
  });
  const polyPoints = points.map(([x, y]) => `${x},${y}`).join(" ");

  // Voice wave bars
  const bars = Array.from({ length: 32 }, (_, i) => {
    const t = (frame - 50 + i * 0.4) / 5;
    const h = Math.abs(Math.sin(t) * Math.cos(t * 0.7)) * 60 + 8;
    const o = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" });
    return { h, o };
  });

  return (
    <AbsoluteFill style={{ padding: "100px 140px", justifyContent: "center" }}>
      <div style={{ opacity: titleO, marginBottom: 50 }}>
        <div style={{ fontFamily: inter, fontSize: 22, color: colors.secondary, letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
          02 — Observations & Voice Notes
        </div>
        <div style={{ fontFamily: grotesk, fontSize: 92, fontWeight: 700, color: colors.text, lineHeight: 1, letterSpacing: -2 }}>
          Capture insight, <span style={{ fontStyle: "italic", background: `linear-gradient(90deg, ${colors.secondary}, ${colors.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>in real time.</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        {/* Radar card */}
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 24,
            padding: 40,
            opacity: interpolate(cardSp, [0, 1], [0, 1]),
            transform: `translateX(${interpolate(cardSp, [0, 1], [-60, 0])}px)`,
          }}
        >
          <div style={{ fontFamily: inter, fontSize: 18, color: colors.muted, marginBottom: 20, textTransform: "uppercase", letterSpacing: 2 }}>Skill Radar</div>
          <svg width="560" height="560" viewBox="0 0 560 560">
            {[0.25, 0.5, 0.75, 1].map((scale, i) => (
              <polygon
                key={i}
                points={angles.map((a) => `${cx + Math.cos(a) * r * scale},${cy + Math.sin(a) * r * scale}`).join(" ")}
                fill="none"
                stroke={colors.border}
                strokeWidth="1"
              />
            ))}
            {angles.map((a, i) => (
              <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke={colors.border} strokeWidth="1" />
            ))}
            <polygon points={polyPoints} fill={`${colors.primary}55`} stroke={colors.primary} strokeWidth="2.5" />
            {skills.map((s, i) => {
              const lx = cx + Math.cos(angles[i]) * (r + 35);
              const ly = cy + Math.sin(angles[i]) * (r + 35);
              const o = interpolate(frame, [30 + i * 3, 45 + i * 3], [0, 1], { extrapolateRight: "clamp" });
              return (
                <text key={s.label} x={lx} y={ly} fill={colors.text} fontSize="20" fontFamily={inter} fontWeight="500" textAnchor="middle" dominantBaseline="middle" opacity={o}>
                  {s.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Voice note + observation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 24,
              padding: 32,
              opacity: interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" }),
              transform: `translateX(${interpolate(spring({ frame: frame - 20, fps, config: { damping: 18 } }), [0, 1], [60, 0])}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: colors.secondary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🎙️</div>
              <div>
                <div style={{ fontFamily: grotesk, fontSize: 24, fontWeight: 700, color: colors.text }}>Voice Note</div>
                <div style={{ fontFamily: inter, fontSize: 16, color: colors.muted }}>Match · 67' · vs FC Porto</div>
              </div>
              <div style={{ marginLeft: "auto", fontFamily: grotesk, fontSize: 22, color: colors.accent }}>0:42</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
              {bars.map((b, i) => (
                <div key={i} style={{ flex: 1, height: b.h, background: `linear-gradient(180deg, ${colors.secondary}, ${colors.primary})`, borderRadius: 4, opacity: b.o }} />
              ))}
            </div>
          </div>

          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 24,
              padding: 32,
              opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" }),
              transform: `translateX(${interpolate(spring({ frame: frame - 40, fps, config: { damping: 18 } }), [0, 1], [60, 0])}px)`,
            }}
          >
            <div style={{ fontFamily: inter, fontSize: 14, color: colors.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Observation · 89'</div>
            <div style={{ fontFamily: grotesk, fontSize: 28, color: colors.text, lineHeight: 1.3, fontWeight: 500 }}>
              "Exceptional spatial awareness. Drops between lines, dictates tempo without the ball."
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
