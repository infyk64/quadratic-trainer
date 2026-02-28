interface Props {
  correct: number;
  total: number;
}

export function ProgressBar({ correct, total }: Props) {
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);

  return (
    <div style={{ width: "100%", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "4px" }}>
        <span>{correct} / {total}</span>
        <span>{percent}%</span>
      </div>
      <div style={{ background: "#e0e0e0", borderRadius: "4px", height: "8px" }}>
        <div
          style={{
            width: percent + "%",
            height: "100%",
            background: percent >= 70 ? "#22c55e" : percent >= 40 ? "#f59e0b" : "#ef4444",
            borderRadius: "4px",
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}