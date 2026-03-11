export function PressureDots({ level }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3].map((l) => (
        <div
          key={l}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: l <= level ? "#5C3D2E" : "#E8D5B7",
          }}
        />
      ))}
    </div>
  );
}
