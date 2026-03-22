# Тренажёр квадратных уравнений

Учебное веб-приложение для отработки навыков решения квадратных уравнений. Поддерживает три роли пользователей: **администратор**, **преподаватель** и **студент**. Преподаватель создаёт вопросы, теорию и тесты; студент проходит тренировки и тесты, видит свою статистику; администратор управляет пользователями и группами.

---

## Стек технологий

### Frontend
- **React 19** + **TypeScript**
- **Vite 8** — сборка и dev-сервер
- **React Router v7** — навигация
- **Axios** — HTTP-клиент
- **Recharts** — графики аналитики
- **EasyMDE / react-simplemde-editor** — редактор теории в Markdown
- **react-markdown** — рендер Markdown на фронтенде

### Backend
- **Node.js** + **Express 5** + **TypeScript**
- **tsx / nodemon** — горячая перезагрузка в dev-режиме
- **PostgreSQL** + **pg** — база данных
- **bcryptjs** — хэширование паролей
- **jsonwebtoken** — JWT-авторизация
- **multer** — загрузка медиафайлов
- **dotenv** — переменные окружения

---

## Архитектура проекта

```
quadratic-trainer/
├── client/               # React-приложение (Vite)
│   └── src/
│       ├── api/          # Axios-клиент с JWT-интерцептором
│       ├── components/   # Переиспользуемые компоненты
│       ├── pages/        # Страницы по ролям
│       └── types/        # TypeScript-типы
│
└── server/               # Express API
    └── src/
        ├── routes/       # REST-роуты (/api/*)
        ├── middleware/   # JWT-миддлвар, multer
        ├── services/     # Бизнес-логика
        └── db/
            ├── pool.ts         # Пул соединений PostgreSQL
            ├── migrate.ts      # Скрипт миграций
            └── migrations/     # SQL-миграции
```

### Роли и страницы

| Роль | Доступные страницы |
|------|-------------------|
| **Студент** | Тренажёр, теория, личная статистика, список тестов, прохождение теста |
| **Преподаватель** | Редактор вопросов, редактор теории, конструктор тестов, статистика группы, аналитика |
| **Администратор** | Управление пользователями, управление группами |

### API-роуты (backend)

| Роут | Описание |
|------|----------|
| `POST /api/auth/login` | Авторизация, получение JWT |
| `GET/POST /api/questions` | Пул вопросов (квадратные уравнения) |
| `GET/POST /api/tests` | Тесты |
| `GET/POST /api/attempts` | Попытки прохождения |
| `GET/POST /api/answers` | Ответы студентов |
| `GET/POST /api/theory-materials` | Теоретические материалы (Markdown) |
| `GET/POST /api/groups` | Группы и участники |
| `GET /api/stats` | Статистика и аналитика |
| `POST /api/media` | Загрузка изображений |

---

## Запуск проекта

### Требования

- Node.js 18+
- PostgreSQL 14+

### 1. Клонировать репозиторий

```bash
git clone <repo-url>
cd quadratic-trainer
```

### 2. Настроить переменные окружения

Создать файл `server/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/quadratic_trainer
JWT_SECRET=your_secret_key
PORT=3001
```

### 3. Запустить миграции базы данных

```bash
cd server
npm install
npx tsx src/db/migrate.ts
```

Миграции создадут все таблицы и добавят тестовых пользователей.

### 4. Запустить backend

```bash
# в папке server/
npm run dev
# сервер запустится на http://localhost:3001
```

### 5. Запустить frontend

```bash
cd client
npm install
npm run dev
# приложение откроется на http://localhost:5173
```

Vite автоматически проксирует запросы `/api/*` на `http://localhost:3001`.

### Сборка для продакшена

```bash
# Backend
cd server && npm run build && npm start

# Frontend
cd client && npm run build
# собранные файлы окажутся в client/dist/
```

---

## Тестовые пользователи

После запуска миграций доступны учётные записи (пароли задаются в `migrate.ts`):

| Роль | Логин |
|------|-------|
| Администратор | `admin` |
| Преподаватель | `teacher` |
| Студент | `student` |

