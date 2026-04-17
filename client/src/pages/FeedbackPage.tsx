import { useState } from "react";
import { api } from "../api/client";

export function FeedbackPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendFeedback = async () => {
    if (!subject.trim() || !message.trim()) {
      alert("Заполните тему и описание проблемы");
      return;
    }

    setSending(true);
    try {
      await api.post("/feedback", {
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubject("");
      setMessage("");
      alert("Сообщение отправлено администратору");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Не удалось отправить сообщение";
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Обратная связь</h1>
      <div className="section-card">
        <h2>Сообщить о проблеме</h2>
        <p style={{ color: "var(--text2)", marginBottom: "16px" }}>
          Опишите проблему как можно подробнее: где возникла, что ожидали увидеть и что произошло.
        </p>
        <input
          type="text"
          placeholder="Тема обращения"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ width: "100%", padding: "12px", fontSize: "15px", marginBottom: "12px" }}
        />
        <textarea
          placeholder="Описание проблемы"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: "100%",
            minHeight: "180px",
            padding: "12px",
            fontSize: "15px",
            resize: "vertical",
          }}
        />
        <button
          onClick={sendFeedback}
          className="btn-primary"
          disabled={sending || !subject.trim() || !message.trim()}
          style={{ marginTop: "14px" }}
        >
          {sending ? "Отправка..." : "Отправить"}
        </button>
      </div>
    </div>
  );
}
