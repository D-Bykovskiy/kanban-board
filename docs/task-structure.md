# Структура хранения задач в Markdown

## Формат файла задачи

Каждая задача хранится в отдельном `.md` файле с YAML frontmatter.

### Пример файла задачи

```markdown
---
id: "task-001"
title: "Реализовать авторизацию"
description: "Добавить JWT авторизацию для API"
status: "in_progress"  # todo, in_progress, done
priority: "high"       # low, medium, high, critical
created_at: "2024-01-15T10:30:00Z"
updated_at: "2024-01-16T14:20:00Z"
due_date: "2024-01-20T23:59:59Z"
tags:
  - "backend"
  - "auth"
  - "security"
assignee: "developer@example.com"
estimated_hours: 8
actual_hours: 0
parent_id: null       # ID родительской задачи (для подзадач)
position: 1           # Позиция в колонке
---

# Реализовать авторизацию

## Описание

Необходимо реализовать JWT авторизацию для всех эндпоинтов API.

## Требования

- [ ] Регистрация пользователя
- [ ] Вход в систему
- [ ] Обновление токена
- [ ] Выход из системы
- [ ] Защита эндпоинтов

## Примечания

Использовать библиотеку `python-jose` для работы с JWT.

## AI-анализ

<!-- Этот раздел генерируется автоматически AI -->
**Сложность:** 3/5
**Риски:** Средние
**Рекомендации:** Использовать FastAPIDepends для защиты роутов
```

## Поля frontmatter

### Обязательные поля

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | Уникальный идентификатор задачи |
| `title` | string | Заголовок задачи |
| `status` | string | Статус: `todo`, `in_progress`, `done` |
| `created_at` | ISO datetime | Дата создания |

### Опциональные поля

| Поле | Тип | Описание |
|------|-----|----------|
| `description` | string | Краткое описание |
| `priority` | string | Приоритет: `low`, `medium`, `high`, `critical` |
| `updated_at` | ISO datetime | Дата последнего обновления |
| `due_date` | ISO datetime | Срок выполнения |
| `tags` | array | Список тегов |
| `assignee` | string | Email ответственного |
| `estimated_hours` | number | Оценка времени (часы) |
| `actual_hours` | number | Фактическое время (часы) |
| `parent_id` | string | ID родительской задачи |
| `position` | number | Позиция в колонке (для сортировки) |
| `calendar_event_id` | string | ID события в Google Calendar |
| `telegram_message_id` | string | ID сообщения в Telegram |

## Структура директорий

```
data/tasks/
├── todo/
│   ├── task-001.md
│   ├── task-002.md
│   └── ...
├── in_progress/
│   ├── task-003.md
│   └── ...
└── done/
    ├── task-000.md
    └── ...
```

## Именование файлов

- Формат: `task-{id}.md`
- ID: уникальный идентификатор (task-001, task-002, ...)
- Расширение: всегда `.md`

## Конвертация статусов

При перемещении задачи между колонками:
1. Изменить поле `status` в frontmatter
2. Переместить файл в соответствующую директорию
3. Обновить `updated_at`

## Парсинг

```python
import frontmatter

# Чтение задачи
post = frontmatter.load('data/tasks/todo/task-001.md')
task_data = post.metadata
task_content = post.content

# Запись задачи
post = frontmatter.Post(content, **metadata)
frontmatter.dump(post, 'data/tasks/todo/task-001.md')
```

## AI-раздел

Раздел `## AI-анализ` генерируется автоматически и содержит:
- Оценку сложности
- Анализ рисков
- Рекомендации
- Предложения по приоритизации

**Важно:** AI-раздел обновляется при каждом анализе задачи.
