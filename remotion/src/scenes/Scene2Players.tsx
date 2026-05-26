import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { grotesk, inter, colors } from "../theme";

const players = [
  { name: "L. Okafor", pos: "ST", age: 21, rating: "8.4", val: "€12M", flag: "🇳🇬" },
  { name: "M. Brandt", pos: "CM", age: 19, rating: "8.1", val: "€9M", flag: "🇩🇪" },
  { name: "R. Silva", pos: "LW", age: 22, rating: "8.7", val: "€18M", flag: "🇧🇷" },
  { name: "J. Hansen", pos: "CB", age: 20, rating: "7.9", val: "€7M", flag: "🇩🇰" },
  { name: "A. Moreno", pos: "RB", age: 23, rating: "8.2", val: "€11M", flag: "🇦🇷" },
  { name: "K. Tanaka", pos: "GK", age: 24, rating: "8.0", val: "€8M", flag: "🇯🇵" },
];

export const Scene2Players: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(spring({ frame, fps, config: { damping: 18 } }), [0, 1], [30, 0]);
  const titleO = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ padding: "100px 140px", justifyContent: "center" }}>
      <div style={{ opacity: titleO, transform: `translateY(${titleY}px)`, marginBottom: 50 }}>
        <div style={{ fontFamily: inter, fontSize: 22, color: colors.primaryGlow, letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
          01 — Player Database
        </div>
        <div style={{ fontFamily: grotesk, fontSize: 92, fontWeight: 700, color: colors.text, lineHeight: 1, letterSpacing: -2 }}>
          Every prospect. <span style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>One database.</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {players.map((p, i) => {
          const start = 12 + i * 7;
          const sp = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 140 } });
          const o = interpolate(sp, [0, 1], [0, 1]);
          const y = interpolate(sp, [0, 1], [40, 0]);
          return (
            <div
              key={p.name}
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 20,
                padding: 28,
                opacity: o,
                transform: `translateY(${y}px)`,
                boxShadow: `0 20px 50px -20px ${colors.primary}40`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: 999, background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                  {p.flag}
                </div>
                <div>
                  <div style={{ fontFamily: grotesk, fontSize: 28, fontWeight: 700, color: colors.text }}>{p.name}</div>
                  <div style={{ fontFamily: inter, fontSize: 16, color: colors.muted }}>{p.pos} · Age {p.age}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
                <div>
                  <div style={{ fontFamily: inter, fontSize: 12, color: colors.muted, textTransform: "uppercase", letterSpacing: 1 }}>Rating</div>
                  <div style={{ fontFamily: grotesk, fontSize: 26, fontWeight: 700, color: colors.accent }}>{p.rating}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: inter, fontSize: 12, color: colors.muted, textTransform: "uppercase", letterSpacing: 1 }}>Value</div>
                  <div style={{ fontFamily: grotesk, fontSize: 26, fontWeight: 700, color: colors.text }}>{p.val}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
