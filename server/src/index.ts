import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import questionsRouter from './routes/questions';
import attemptsRouter from './routes/attempts';
import usersRouter from './routes/user';

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

// Тестовый маршрут — проверяем что сервер живой
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running 🟢' });
});

// Запуск
app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});