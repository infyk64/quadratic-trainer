import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import questionsRouter from './routes/questions';
import attemptsRouter from './routes/attempts';
import usersRouter from './routes/user';
import theoryQuestionsRouter from "./routes/theoryQuestions";
import mediaRouter from './routes/media';
import path from 'path';
import theoryMaterialsRouter from "./routes/theoryMaterials";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // адрес клиента (Vite)
  credentials: true,
}));
app.use(express.json());
app.use('/api/questions', questionsRouter);
app.use('/api/attempts', attemptsRouter);
app.use('/api/users', usersRouter);
app.use("/api/theory-questions", theoryQuestionsRouter);
app.use('/api/media', mediaRouter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use("/api/theory-materials", theoryMaterialsRouter);

// Тестовый маршрут — проверяем что сервер живой
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running 🟢' });
});

// Запуск
app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});