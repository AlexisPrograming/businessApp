import { useState } from "react";

export function DonutChart({ categories }) {
  const [hovered, setHovered] = useState(null);
  const size = 160;
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = (categories || []).map((c) => {
    const pct = Math.min(100, Math.max(0, c.pct ?? 0));
    const dash = (pct / 100) * circ;
    const s = { ...c, pct, dash, gap: circ - dash, offset };
    offset += dash;
    return s;
  });
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {segs.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color || "#E8D5B7"}
            strokeWidth={hovered === i ? 26 : 22}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            style={{ transition: "all 0.4s ease", cursor: "pointer" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>
      {hovered !== null && segs[hovered] && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#2C1A0E", fontWeight: 400 }}>
            {segs[hovered]?.name}
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>
            {segs[hovered]?.pct}%
          </div>
        </div>
      )}
    </div>
  );
}
