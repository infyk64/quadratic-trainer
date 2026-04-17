# Тренажёр квадратных уравнений

Учебное веб-приложение для практики квадратных уравнений и контроля знаний.
Проект разделён по ролям: **студент**, **преподаватель**, **администратор**.

## Что умеет проект

- **Студент**
  - решает задания в тренажёре;
  - проходит назначенные тесты;
  - смотрит личную статистику;
  - отправляет сообщения через форму обратной связи.
- **Преподаватель**
  - создаёт, редактирует и удаляет теоретические материалы;
  - управляет теоретическими вопросами;
  - собирает тесты и назначает их группам;
  - смотрит статистику и аналитику по студентам.
- **Администратор**
  - управляет пользователями и группами;
  - экспортирует данные о вопросах и успеваемости в CSV;
  - просматривает журнал действий;
  - обрабатывает обратную связь студентов.

## Технологии

- **Frontend:** React 19, TypeScript, Vite, React Router, Axios, Recharts, React Markdown.
- **Backend:** Node.js, Express 5, TypeScript, PostgreSQL, pg, JWT, bcryptjs, multer.

## Структура проекта

```text
quadratic-trainer/
├── client/                 # фронтенд (Vite + React)
│   └── src/
│       ├── api/            # HTTP-клиент
│       ├── components/     # переиспользуемые компоненты
│       ├── pages/          # страницы приложения
│       └── types/          # TypeScript-типы
└── server/                 # backend (Express API)
    └── src/
        ├── routes/         # API-роуты
        ├── middleware/     # auth/upload middleware
        ├── services/       # сервисная логика
        └── db/
            ├── pool.ts
            ├── migrate.ts
            └── migrations/
```

## Быстрый запуск

### 1) Требования

- Node.js 18+
- PostgreSQL 14+

### 2) Клонирование

```bash
git clone https://github.com/infyk64/quadratic-trainer
cd quadratic-trainer
```

### 3) Настройка backend

Создай файл `server/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/quadratic_trainer
JWT_SECRET=your_secret_key
PORT=3001
```

Установи зависимости и выполни миграции:

```bash
cd server
npm install
npx tsx src/db/migrate.ts
```

Запусти сервер:

```bash
npm run dev
```

Backend будет доступен на `http://localhost:3001`.

### 4) Настройка frontend

В новом терминале:

```bash
cd client
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:5173`.

## Production-сборка

```bash
# backend
cd server
npm run build
npm start

# frontend
cd client
npm run build
```

## Тестовые пользователи

После миграций создаётся администратор:

- логин: `admin`
- пароль: `admin123`

Остальные пользователи создаются администратором через интерфейс.

## Полезные разделы API

- `POST /api/auth/login` - вход и JWT.
- `GET/POST/PUT/DELETE /api/theory-materials` - материалы.
- `GET/POST/DELETE /api/theory-questions` - теоретические вопросы.
- `GET /api/theory-questions/export` - экспорт вопросов CSV (admin).
- `GET /api/stats/export/student-performance` - экспорт успеваемости CSV (admin).
- `GET /api/logs` - журнал действий (admin).
- `POST /api/feedback` - отправка обратной связи студентом.
