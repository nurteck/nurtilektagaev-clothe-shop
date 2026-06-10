# Oshop — Интернет-магазин одежды

Современный full-stack интернет-магазин одежды, обуви и аксессуаров.

## Стек

- **Frontend:** React + Vite + TypeScript + CSS Modules
- **Backend:** Node.js + Express + TypeScript
- **База данных:** PostgreSQL + Prisma ORM
- **Авторизация:** JWT

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Скопируйте `.env.example` в `.env`:

```bash
copy .env.example .env
```

### 3. Запуск PostgreSQL

```bash
npm run db:up
```

### 4. Миграции и демо-данные

```bash
npm run db:setup
```

### 5. Запуск проекта

```bash
npm run dev
```

Откройте в браузере:

- **Магазин:** http://localhost:5173
- **API:** http://localhost:4000/api/health

## Демо-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Покупатель | user@oshop.com | user123 |
| Администратор | admin@oshop.com | admin123 |

## Структура проекта

```
oshop/
├── client/          # React frontend
├── server/          # Express API
│   ├── prisma/      # Схема БД, миграции, seed
│   └── src/         # API routes, middleware
├── docker-compose.yml
└── package.json     # Monorepo scripts
```

## Основные маршруты

### Покупатель
- `/` — Главная страница
- `/catalog` — Каталог с фильтрами
- `/product/:slug` — Карточка товара
- `/cart` — Корзина
- `/checkout` — Оформление заказа
- `/profile` — Профиль и заказы
- `/favorites` — Избранное

### Администратор
- `/admin` — Dashboard
- `/admin/products` — Управление товарами
- `/admin/categories` — Категории
- `/admin/brands` — Бренды
- `/admin/banners` — Баннеры
- `/admin/orders` — Заказы
- `/admin/users` — Пользователи

## Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск frontend + backend |
| `npm run dev:client` | Только frontend |
| `npm run dev:server` | Только backend |
| `npm run db:up` | Запуск PostgreSQL |
| `npm run db:down` | Остановка PostgreSQL |
| `npm run db:migrate` | Применить миграции |
| `npm run db:seed` | Заполнить демо-данными |
| `npm run build` | Сборка проекта |
