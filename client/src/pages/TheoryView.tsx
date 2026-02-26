import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { api } from "../api/client";

interface TheoryMaterial {
  id: number;
  title: string;
  content: string;
  author_id?: number;
  created_at: string;
}

export function TheoryView() {
  const [materials, setMaterials] = useState<TheoryMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] =
    useState<TheoryMaterial | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const { data } = await api.get<TheoryMaterial[]>("/theory-materials");
      setMaterials(data);
    } catch (err) {
      console.error("Ошибка загрузки материалов:", err);
    }
  };

  return (
    <div className="page-container">
      <h1>📚 Теоретические материалы</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: "20px",
        }}
      >
        {/* Список материалов */}
        <div className="section-card" style={{ height: "fit-content" }}>
          <h2>Темы</h2>

          {materials.length === 0 ? (
            <p style={{ color: "var(--text2)", fontSize: "14px" }}>
              Пока нет материалов
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {materials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => setSelectedMaterial(material)}
                  style={{
                    padding: "12px",
                    background:
                      selectedMaterial?.id === material.id
                        ? "var(--accent2)"
                        : "var(--surface2)",
                    color: "white",
                    border:
                      selectedMaterial?.id === material.id
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "15px",
                    transition: "all 0.2s",
                  }}
                >
                  {material.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Содержимое */}
        <div className="section-card">
          {selectedMaterial ? (
            <div>
              <h2>{selectedMaterial.title}</h2>
              <div
                style={{
                  color: "var(--text)",
                  lineHeight: "1.8",
                  fontSize: "16px",
                }}
              >
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        style={{
                          color: "var(--text)",
                          marginTop: "24px",
                          marginBottom: "12px",
                        }}
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        style={{
                          color: "var(--text)",
                          marginTop: "20px",
                          marginBottom: "10px",
                        }}
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        style={{
                          color: "var(--text)",
                          marginTop: "16px",
                          marginBottom: "8px",
                        }}
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p style={{ marginBottom: "12px" }} {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        style={{ marginLeft: "24px", marginBottom: "12px" }}
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        style={{ marginLeft: "24px", marginBottom: "12px" }}
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li style={{ marginBottom: "6px" }} {...props} />
                    ),
                    img: ({ node, ...props }) => (
                      <img
                        {...props}
                        style={{
                          maxWidth: "600px",
                          width: "100%",
                          height: "auto",
                          borderRadius: "8px",
                          marginTop: "12px",
                          marginBottom: "12px",
                          display: "block",
                        }}
                      />
                    ),
                    code: ({ node, inline, ...props }: any) => {
                      const codeString = String(props.children || "");

                      // Скрываем HTML-код видео
                      if (
                        codeString.includes("<video") ||
                        codeString.includes("</video>")
                      ) {
                        return null;
                      }

                      return inline ? (
                        <code
                          style={{
                            background: "var(--surface2)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontFamily: "var(--mono)",
                            fontSize: "14px",
                          }}
                          {...props}
                        />
                      ) : (
                        <code
                          style={{
                            display: "block",
                            background: "var(--surface2)",
                            padding: "12px",
                            borderRadius: "8px",
                            fontFamily: "var(--mono)",
                            fontSize: "14px",
                            overflow: "auto",
                          }}
                          {...props}
                        />
                      );
                    },
                    strong: ({ node, ...props }) => (
                      <strong style={{ color: "var(--accent)" }} {...props} />
                    ),
                  }}
                >
                  {selectedMaterial.content.replace(
                    /<video[\s\S]*?<\/video>/g,
                    "",
                  )}
                </ReactMarkdown>

                {/* Рендеринг видео */}
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedMaterial.content
                        .match(/<video[\s\S]*?<\/video>/g)
                        ?.join("") || "",
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--text2)",
              }}
            >
              <p style={{ fontSize: "18px" }}>Выберите тему из списка слева</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
