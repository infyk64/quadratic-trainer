interface Props {
  isCorrect: boolean;
  expected?: string;
}

export function ResultFeedback({ isCorrect, expected }: Props) {
  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "8px",
        background: isCorrect ? "#f0fdf4" : "#fef2f2",
        border: "1px solid " + (isCorrect ? "#bbf7d0" : "#fecaca"),
        color: isCorrect ? "#16a34a" : "#dc2626",
        fontSize: "15px",
        fontWeight: 500,
        textAlign: "center",
        marginTop: "12px",
      }}
    >
      {isCorrect
        ? "Верно!"
        : "Неверно." + (expected ? " Правильный ответ: " + expected : "")}
    </div>
  );
}