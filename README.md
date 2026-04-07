# Лабораторная работа №36: Итоговый проект — TaskBoard

## Основная информация

**ФИО:** Грошев Никита Андреевич  
**Группа:** ИСП-232  
**Дата:** 07.04.2026

---

## Описание проекта

**TaskBoard** — это полноценное веб-приложение для управления задачами, объединяющее:

- **Backend** — ASP.NET Core Web API с Entity Framework Core и SQLite
- **Frontend** — HTML, CSS и JavaScript с динамическим взаимодействием через Fetch API

Приложение позволяет пользователю создавать, просматривать, редактировать, отмечать выполненные и удалять задачи. Все данные сохраняются в базе данных SQLite и не теряются при перезапуске сервера.

---

## Функциональность

| Функция | Описание |
|---------|----------|
| ➕ Создание задачи | Добавление новой задачи с названием и описанием |
| 📋 Просмотр списка | Отображение всех задач с сортировкой (невыполненные сверху) |
| ✅ Отметка выполнения | Чекбокс для переключения статуса задачи |
| ✏️ Редактирование | Изменение названия и описания через режим редактирования |
| 🗑️ Удаление | Удаление задачи с подтверждением |
| 🔍 Фильтрация | Показ всех / активных / выполненных задач |
| 📊 Счётчик | Отображение количества выполненных задач |
| 💾 Сохранение | Данные хранятся в SQLite, не теряются при перезапуске |

---

## Как запустить проект

### 1. Запуск бэкенда (API)

```bash
cd TaskBoardApi
dotnet restore
dotnet ef database update   # создаёт базу данных
dotnet run
```

Сервер запустится на порту, указанном в `launchSettings.json` (например, `http://localhost:5000`).

### 2. Запуск фронтенда

Откройте файл `frontend/index.html` через **Live Server** в VS Code или просто дважды кликните по файлу.

**Важно:** Убедитесь, что порт в `frontend/js/api.js` совпадает с портом сервера:

```javascript
const API_URL = "http://localhost:5000/api/tasks";
```

---

## Структура проекта

```
Lab36_TaskBoard/
│
├── TaskBoardApi/                        # Backend (ASP.NET Core)
│   ├── Controllers/
│   │   └── TasksController.cs           # API для задач
│   ├── Models/
│   │   └── TaskItem.cs                  # Модель задачи
│   ├── Data/
│   │   └── AppDbContext.cs              # Контекст БД (SQLite)
│   ├── Program.cs                       # Настройка CORS, JSON, БД
│   ├── appsettings.json                 # Строка подключения к БД
│   └── taskboard.db                     # Файл базы данных (создаётся после миграции)
│
├── frontend/                            # Frontend (HTML/CSS/JS)
│   ├── index.html                       # Главная страница
│   ├── css/
│   │   └── style.css                    # Стили (адаптивный дизайн)
│   └── js/
│       ├── api.js                       # HTTP-запросы к API
│       └── app.js                       # Логика интерфейса (рендеринг, фильтры)
│
├── img/                                 # Скриншоты
│   ├── gitPushLab36_Groshev.png
│   ├── step3_swaggerLab36_Groshev.png
│   └── step5_appLab36_Groshev.png
│
└── README.md
```

---

## Таблица маршрутов API

| Метод | Маршрут | Описание | Статус успеха |
|-------|---------|----------|----------------|
| GET | `/api/tasks` | Получить все задачи (сортировка: невыполненные сверху) | 200 OK |
| GET | `/api/tasks/{id}` | Получить задачу по ID | 200 OK / 404 |
| POST | `/api/tasks` | Создать новую задачу | 201 Created / 400 |
| PUT | `/api/tasks/{id}` | Обновить задачу | 200 OK / 400 / 404 |
| DELETE | `/api/tasks/{id}` | Удалить задачу | 204 No Content / 404 |

---

## Примеры curl-команд

### GET все задачи
```bash
curl http://localhost:5000/api/tasks
```

### GET задачу по ID
```bash
curl http://localhost:5000/api/tasks/1
```

### POST создать задачу
```bash
curl -X POST http://localhost:5000/api/tasks \
-H "Content-Type: application/json" \
-d '{"title":"Новая задача","description":"Описание задачи"}'
```

### PUT обновить задачу
```bash
curl -X PUT http://localhost:5000/api/tasks/1 \
-H "Content-Type: application/json" \
-d '{"title":"Обновлённая задача","description":"Новое описание","isCompleted":true}'
```

### DELETE удалить задачу
```bash
curl -X DELETE http://localhost:5000/api/tasks/1
```

---

## Команды EF Core (миграции)

```bash
# Установка глобального инструмента
dotnet tool install --global dotnet-ef

# Создание миграции
dotnet ef migrations add InitialCreate

# Применение миграции к БД
dotnet ef database update

# Удаление последней миграции (если не применена)
dotnet ef migrations remove

# Просмотр списка миграций
dotnet ef migrations list
```

---

## Ключевые моменты реализации

### Backend (ASP.NET Core)

- **Сортировка задач** — невыполненные задачи поднимаются вверх:
```csharp
var tasks = await _db.Tasks
    .OrderBy(t => t.IsCompleted)
    .ThenByDescending(t => t.CreatedAt)
    .ToListAsync();
```

- **Автоматические миграции** при запуске:
```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}
```

- **CORS** настроен для взаимодействия с фронтендом

### Frontend (JavaScript)

- **Разделение кода** — `api.js` для запросов, `app.js` для логики интерфейса
- **Фильтрация** — без дополнительных запросов к серверу (работа с локальным массивом)
- **Режимы карточки** — просмотр и редактирование
- **Экранирование HTML** — защита от XSS-атак
- **Блокировка кнопки** во время запроса

---

## Главные выводы

1. **Entity Framework Core** — Удобная и простая возможность написания LINQ запросов для обращения DB

2. **Миграции** — Что может лучше опитимазации ручного обновления?

3. **Code First** — Подход, и понимание архетектуры проэкта очень важно

4. **Асинхронность** (`async/await`) — Как вообще можно не работать с этим в нынешнем мире?

5. **Разделение ответственности** — Модульность кода всегда облегчает работу и дебагинг, + на базе проэкта можно и допилить свою идею и захостить еего

6. **CORS** — просто обязательно и никак иначе

---

## GitHub репозиторий

[Ссылка на репозиторий](https://github.com/Hig-lime-simp/isrpo_lab36)