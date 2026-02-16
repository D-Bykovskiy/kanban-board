# Kanban Board with AI

Современная Kanban-доска для управления задачами с AI-ассистентом, использующая markdown-файлы для хранения данных.

## 🚀 Быстрый старт

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend
cd frontend
npm install
npm run dev
```

## 📋 Функциональность

- ✅ Kanban-доска с drag-and-drop
- ✅ Хранение задач в markdown файлах
- ✅ Интеграция с Google Calendar
- ✅ Telegram бот для уведомлений
- ✅ AI-ассистент (Groq/Gemini API)

## 🏗 Архитектура

```
kanban-board/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── data/tasks/       # Markdown файлы задач
├── tests/           # Тесты
└── docs/            # Документация
```

## 📚 Документация

- [План проекта](./docs/project-plan.md)
- [Архитектура](./docs/architecture.md)
- [API документация](./docs/api.md)

## 🛠 Технологический стек

- **Backend:** FastAPI, Python 3.11+
- **Frontend:** React 18, TypeScript
- **AI:** Groq API, Google Gemini
- **Storage:** Markdown files, SQLite

## ⚠️ Требования

- Python 3.11+
- Node.js 18+
- API ключи (Groq или Gemini)

## 📄 Лицензия

MIT
