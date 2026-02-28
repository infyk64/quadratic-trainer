import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Routes
import authRouter from "./routes/auth";
import questionsRouter from "./routes/questions";
import attemptsRouter from "./routes/attempts";
import usersRouter from "./routes/user";
import theoryQuestionsRouter from "./routes/theoryQuestions";
import mediaRouter from "./routes/media";
import theoryMaterialsRouter from "./routes/theoryMaterials";
import groupsRouter from "./routes/groups";
import testsRouter from "./routes/tests";
import answersRouter from "./routes/answers";
import statsRouter from "./routes/stats";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ===== Routes =====

// Авторизация — без JWT (публичный)
app.use("/api/auth", authRouter);

// Защищённые роуты
app.use("/api/questions", questionsRouter);
app.use("/api/attempts", attemptsRouter);
app.use("/api/users", usersRouter);
app.use("/api/theory-questions", theoryQuestionsRouter);
app.use("/api/media", mediaRouter);
app.use("/api/theory-materials", theoryMaterialsRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/tests", testsRouter);
app.use("/api/answers", answersRouter);
app.use("/api/stats", statsRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running 🟢" });
});

// Запуск
app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});