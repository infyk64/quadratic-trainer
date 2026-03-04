import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { api } from "../api/client";

export function TheoryEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [materials, setMaterials] = useState<Array<{ id: number; title: string; content: string }>>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const { data } = await api.get('/theory-materials');
      setMaterials(data);
    } catch (err) {
      console.error('Ошибка загрузки материалов:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const { data } = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const imageMarkdown = `![${file.name}](http://localhost:3001${data.url})`;
      setContent(prev => prev + "\n\n" + imageMarkdown);
      alert("Изображение загружено!");
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      alert("Не удалось загрузить изображение");
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const { data } = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const videoMarkdown = `\n\n<video controls width="100%">\n  <source src="http://localhost:3001${data.url}" type="${file.type}">\n</video>\n\n`;
      setContent(prev => prev + videoMarkdown);
      alert("Видео загружено!");
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      alert("Не удалось загрузить видео");
    } finally {
      setUploading(false);
    }
  };

  const saveMaterial = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Заполните название и содержание");
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      
      await api.post('/theory-materials', {
        title: title.trim(),
        content: content.trim(),
        author_id: userId ? parseInt(userId) : null,
      });

      setTitle("");
      setContent("");
      loadMaterials();
      alert("Материал сохранён в базу данных!");
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      alert("Не удалось сохранить материал");
    }
  };

  const deleteMaterial = async (id: number) => {
    if (!confirm("Удалить материал из базы данных?")) return;
    
    try {
      await api.delete(`/theory-materials/${id}`);
      loadMaterials();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert("Не удалось удалить материал");
    }
  };

  return (
    <div className="page-container">
      <h1>Редактор теоретических материалов</h1>

      <div className="section-card">
        <h2>Создать новый материал</h2>

        <input
          type="text"
          placeholder="Название материала"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            marginBottom: "16px",
          }}
        />

        <div style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: "8px 16px",
              background: showPreview ? "var(--accent2)" : "var(--surface2)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {showPreview ? "Редактор" : "Превью"}
          </button>

          <label style={{
            padding: "8px 16px",
            background: uploading ? "var(--surface2)" : "var(--accent)",
            color: "white",
            borderRadius: "6px",
            cursor: uploading ? "not-allowed" : "pointer",
            border: "none",
            display: "inline-block",
          }}>
            {uploading ? "Загрузка..." : "Изображение"}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>

          <label style={{
            padding: "8px 16px",
            background: uploading ? "var(--surface2)" : "var(--accent3)",
            color: "white",
            borderRadius: "6px",
            cursor: uploading ? "not-allowed" : "pointer",
            border: "none",
            display: "inline-block",
          }}>
          {uploading ? "Загрузка..." : "Видео"}
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {showPreview ? (
          <div style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "16px",
            minHeight: "300px",
            color: "var(--text)",
          }}>
            <ReactMarkdown
              components={{
                img: ({node, ...props}) => (
                  <img {...props} style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "12px" }} />
                ),
              }}
            >
              {content || "*Пусто*"}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            placeholder="Напишите теоретический материал в формате Markdown..."
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{
              width: "100%",
              minHeight: "300px",
              padding: "12px",
              fontSize: "16px",
              fontFamily: "var(--mono)",
              resize: "vertical",
              lineHeight: "1.6",
            }}
          />
        )}

        <button
          onClick={saveMaterial}
          className="btn-primary"
          style={{ marginTop: "16px" }}
        >
          Сохранить материал
        </button>
      </div>

      <div className="section-card">
        <h2>Сохранённые материалы ({materials.length})</h2>

        {materials.length === 0 ? (
          <p style={{ color: "var(--text2)" }}>Пока нет материалов</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {materials.map(material => (
              <div
                key={material.id}
                style={{
                  padding: "16px",
                  background: "var(--surface2)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <h3 style={{ margin: 0 }}>{material.title}</h3>
                  <button
                    onClick={() => deleteMaterial(material.id)}
                    style={{
                      padding: "6px 12px",
                      background: "var(--red)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Удалить
                  </button>
                </div>
                <p style={{
                  color: "var(--text2)",
                  fontSize: "14px",
                  margin: "8px 0 0 0",
                  maxHeight: "60px",
                  overflow: "hidden",
                }}>
                  {material.content.substring(0, 150)}...
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}