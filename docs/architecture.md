# Архитектура проекта Kanban Board

## Общая архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   React App  │  │  Telegram    │  │   Google Calendar    │  │
│  │   (Browser)  │  │    Bot       │  │       API            │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
          └─────────────────┴─────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                      API LAYER (FastAPI)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Task Routes │  │  AI Routes  │  │ Integration Routes      │  │
│  │             │  │             │  │ (Calendar, Telegram)    │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
│  ┌──────▼────────────────▼──────────────────────▼───────────┐   │
│  │              SERVICES LAYER                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐   │   │
│  │  │  Task    │ │   AI     │ │ Calendar │ │ Telegram  │   │   │
│  │  │ Service  │ │ Service  │ │ Service  │ │  Service  │   │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘   │   │
│  └───────┼────────────┼────────────┼─────────────┼─────────┘   │
└──────────┼────────────┼────────────┼─────────────┼──────────────┘
           │            │            │             │
┌──────────▼────────────▼────────────▼─────────────▼──────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Markdown    │  │   SQLite     │  │       Redis          │  │
│  │   Files      │  │  (Metadata)  │  │    (Cache/Queue)     │  │
│  │  (tasks/*.md)│  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Компоненты системы

### 1. Frontend (React + TypeScript)

```
frontend/
├── src/
│   ├── components/          # UI компоненты
│   │   ├── Board/          # Kanban доска
│   │   ├── TaskCard/       # Карточка задачи
│   │   ├── TaskForm/       # Форма создания/редактирования
│   │   ├── Column/         # Колонка (To Do, In Progress, Done)
│   │   └── AIAssistant/    # AI-панель
│   ├── hooks/              # React hooks
│   │   ├── useTasks.ts     # Управление задачами
│   │   ├── useDragAndDrop.ts  # DnD логика
│   │   └── useAI.ts        # AI запросы
│   ├── store/              # Zustand store
│   │   └── taskStore.ts    # Состояние задач
│   ├── services/           # API сервисы
│   │   ├── api.ts          # Axios instance
│   │   ├── taskService.ts  # API задач
│   │   └── aiService.ts    # API AI
│   ├── types/              # TypeScript типы
│   │   └── index.ts
│   └── utils/              # Утилиты
│       └── dateUtils.ts
```

### 2. Backend (FastAPI)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py             # Точка входа
│   ├── config.py           # Конфигурация
│   ├── database.py         # Подключение к БД
│   ├── models/             # SQLAlchemy модели
│   │   ├── __init__.py
│   │   └── task.py
│   ├── schemas/            # Pydantic схемы
│   │   ├── __init__.py
│   │   └── task.py
│   ├── routers/            # API endpoints
│   │   ├── __init__.py
│   │   ├── tasks.py        # CRUD задач
│   │   ├── ai.py           # AI endpoints
│   │   ├── calendar.py     # Google Calendar
│   │   └── telegram.py     # Telegram webhooks
│   ├── services/           # Бизнес-логика
│   │   ├── __init__.py
│   │   ├── task_service.py
│   │   ├── ai_service.py
│   │   ├── ai_providers.py # Groq, Gemini, Ollama
│   │   ├── calendar_service.py
│   │   └── telegram_service.py
│   └── utils/              # Утилиты
│       ├── __init__.py
│       └── markdown.py     # Работа с .md файлами
```

### 3. Хранение данных

#### Markdown файлы
- Каждая задача = отдельный `.md` файл
- Frontmatter для метаданных
- Markdown для описания

#### SQLite
- Метаданные для быстрого поиска
- Индексы по тегам, статусам, датам
- Кэш AI-анализов

#### Redis
- Очередь задач Celery
- Кэш AI-ответов
- Сессии

## Поток данных

### Создание задачи

```
1. Frontend → POST /api/tasks
   {title, description, priority, tags, due_date}

2. Backend (TaskService)
   ├── Создать Task объект
   ├── Сохранить в SQLite
   ├── Сгенерировать .md файл
   └── Отправить в AI Service (async)

3. AI Service (Celery)
   ├── Проанализировать задачу
   ├── Обновить .md файл (AI-раздел)
   └── Обновить SQLite (оценка сложности)

4. Response → Frontend
   {task_id, status, ai_analysis}
```

### Перемещение задачи (Drag & Drop)

```
1. Frontend → PATCH /api/tasks/{id}
   {status: "in_progress", position: 2}

2. Backend
   ├── Обновить SQLite
   ├── Переместить .md файл (todo/ → in_progress/)
   ├── Обновить frontmatter
   └── Если due_date → обновить Google Calendar

3. Response → Frontend
   {success, new_position}
```

### AI анализ

```
1. Frontend → POST /api/ai/analyze
   {task_id, context}

2. AI Service
   ├── Получить задачу из .md
   ├── Проверить кэш (Redis)
   ├── Вызвать AI API (Groq → Gemini → Ollama)
   ├── Сохранить в кэш
   └── Обновить .md файл

3. Response → Frontend
   {complexity, risks, recommendations}
```

## Интеграции

### Google Calendar
- OAuth 2.0 аутентификация
- Синхронизация due_date
- Создание/обновление/удаление событий

### Telegram Bot
- Webhook для получения сообщений
- Команды: /tasks, /add, /done
- Уведомления о дедлайнах (Celery beat)
- AI-ответы на вопросы о задачах

## AI провайдеры (Fallback цепочка)

```python
class AIService:
    def __init__(self):
        self.providers = [
            GroqProvider(),      # Primary: быстрый, щедрые лимиты
            GeminiProvider(),    # Secondary: стабильный
            OllamaProvider()     # Fallback: локальный
        ]
    
    async def generate(self, prompt):
        for provider in self.providers:
            try:
                return await provider.generate(prompt)
            except RateLimitError:
                continue  # Переход к следующему
            except Exception as e:
                logger.error(f"{provider.name} failed: {e}")
                continue
        raise AllProvidersFailed()
```

## Безопасность

- JWT токены для аутентификации
- CORS настройки
- Rate limiting (AI API)
- Валидация входных данных (Pydantic)
- Санитизация markdown (bleach)

## Масштабирование

### Горизонтальное
- Load balancer перед FastAPI
- Redis Cluster
- SQLite → PostgreSQL при росте

### Оптимизация
- CDN для статики
- AI response caching
- Batch операции с Calendar API
- WebSocket для real-time обновлений
