export function SparkBar({ values, highlightToday = true }) {
  const safe = Array.isArray(values) && values.length === 7 ? values : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = (new Date().getDay() + 6) % 7;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
      {safe.map((v, i) => (
        <div
          key={i}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 8,
              color: i === todayIdx ? "#A67C52" : "#C4A882",
              letterSpacing: 0,
            }}
          >
            {v > 0 ? `$${Math.round(v)}` : ""}
          </div>
          <div
            style={{
              width: "100%",
              height: `${(v / max) * 54}px`,
              minHeight: v > 0 ? 4 : 0,
              background:
                i === todayIdx && highlightToday ? "linear-gradient(180deg, #A67C52, #C4A882)" : "#E8D5B7",
              borderRadius: "4px 4px 2px 2px",
              transition: `height 0.8s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.06}s`,
            }}
          />
          <span
            style={{
              fontSize: 8,
              color: i === todayIdx ? "#A67C52" : "#9B8878",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: 0.5,
            }}
          >
            {days[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
