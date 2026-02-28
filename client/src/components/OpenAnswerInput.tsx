import { useState } from "react";

interface Props {
  onSubmit: (answer: string) => void;
  disabled: boolean;
  placeholder?: string;
  type?: "equation" | "theory";
}

export function OpenAnswerInput({ onSubmit, disabled, placeholder, type = "equation" }: Props) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (!answer.trim() || disabled) return;
    onSubmit(answer.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const resetInput = () => {
    setAnswer("");
  };

  // Экспортируем reset через эффект
  // Родитель может передать disabled=false при новом вопросе — сбрасываем
  if (!disabled && answer === "") {
    // input уже пуст
  }

  const defaultPlaceholder =
    type === "equation"
      ? "Введите корни через запятую (или «нет корней»)"
      : "Введите ответ...";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder || defaultPlaceholder}
        autoFocus
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "18px",
          background: "var(--surface2)",
          color: "var(--text)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          outline: "none",
          textAlign: "center",
        }}
      />

      {type === "equation" && !disabled && (
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
          {["нет корней", ",", "-", ".", "√"].map((hint) => (
            <button
              key={hint}
              onClick={() => setAnswer((prev) => prev + (hint === "," ? ", " : hint))}
              style={{
                padding: "4px 10px",
                background: "var(--surface2)",
                color: "var(--text2)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {hint}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || disabled}
        className="btn-primary"
      >
        Проверить (Enter)
      </button>
    </div>
  );
}