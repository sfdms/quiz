# Техническое задание

## 1. Цель проекта

Создать учебное веб-приложение «Quiz Marathon» — интерактивную викторину с системой очков и турнирной таблицей.
Пользователь проходит короткие тесты (квизы) по разным темам, набирает очки, и результаты сохраняются в ТОП-10 игроков.

## 2. Функционал

- Прохождение викторины (вопросы с 4 вариантами ответов).

- Подсчёт и сохранение очков.

- Отображение турнирной таблицы (ТОП-10).

- Простая регистрация по никнейму.

- Страница с правилами.

- Адаптивный интерфейс.

## 3. Архитектура

- **Backend**: Python + Flask.

- **База данных**: SQLite (users, results, questions).

- **Frontend**: HTML, CSS, JS.

- **Шаблонизатор**: Jinja2.

## 4. Структура проекта
```
quiz/
├── app.py
├── db.py
├── schema.sql
├── quiz_engine.py
├── requirements.txt
│
├── static/
│   ├── app.js
│   └── styles.css
│
└── templates/
    ├── base.html
    ├── index.html
    ├── quiz.html
    ├── rules.html
    └── leaderboard.html
```

## 5. План разработки (спринты)
### Спринт 1 — Настройка проекта и каркас

**DoD(Definition of Done)**: репозиторий создан, проект запускается (flask run), база инициализируется, главная страница с вводом ника открывается.

**Backend (Flask + API + БД)**

- `chore: repo init, add requirements, README` — создать репо, `requirements.txt`, краткое руководство запуска.

- `feat(flask): app skeleton — app.py с create_app()`, маршруты `GET /` и `GET /rules`, подключение templates и статики.

- `feat(db): init_db — schema.sql` с таблицами `users`, `game_sessions`; `db.py` с `get_db()` и `init_db()` + команда `flask init-db`.
Критерий приёмки: `flask init-db` создаёт файл БД; при заходе на / возвращается HTML (200).

**Игровая логика + Frontend (JS)**

- `feat(quiz): add quiz_engine skeleton — quiz_engine.py` с заглушками `generate_question()` и `calculate_score()`.

- `chore(js): connect app.js` — подключение `static/app.js` в `base.html`; в консоль выводится тестовый вопрос.
Критерий приёмки: консоль браузера показывает тестовый вопрос при загрузке `/`.

**Верстальщик / UI-дизайнер**

- `feat(ui): base templates` — `templates/base.html`, `index.html` с формой ввода ника и кнопкой `Start`.

- `style: basic css` — `static/styles.css` простая сетка, подключение мета тега `viewport`.
Критерий приёмки: форма ввода ника видна и стилизована базово.

### Спринт 2 — Каркас API, вопросы и playable demo

**DoD(Definition of Done)**: можно начать игру, показываются вопросы, клиент считает очки локально, leaderboard возвращает тестовые данные.

**Backend (Flask + API + БД)**

- `feat(api): implement /api/start` — `POST {nickname}` → создаёт/возвращает `user_id`, сохраняет в сессии.

- `feat(api): implement /api/leaderboard` — `GET` → возвращает тестовый массив ТОП-10 (JSON).

- `feat(db): persist users` — вставка в users при регистрации.
Критерий приёмки: при `POST /api/start` создаётся запись в `users`; `GET /api/leaderboard` возвращает JSON.

**Игровая логика + Frontend (JS)**

- `feat(quiz): load questions` — добавить `data/questions.json` или встроенный массив (30 вопросов).

- `feat(js): implement question loop`— функции `startGame()`, `nextQuestion()`, локальный таймер (10s), `submitAnswer()` отправляет `fetch /api/answer` (сервер пока заглушка).

- `feat(score): implement calculate_score` — локальная реализация формулы `difficulty * base + time_bonus`.
Критерий приёмки: при старте игры вопросы показываются, таймер считает, при выборе ответа вызывается `fetch`.

**Верстальщик / UI-дизайнер**

- `feat(ui): question card markup` — карточка вопроса, 4 варианта, индикатор таймера и combo.

- `feat(ui): leaderboard render` — подключение _leaderboard.html и рендер JSON в таблицу.
Критерий приёмки: интерфейс вопроса и таблица лидеров корректно отображают данные.

### Спринт 3 — Серверная логика, валидация, синхронизация

**DoD(Definition of Done)**: сервер валидирует ответы и начисляет очки; результаты сохраняются в БД; UI получает и отображает итоговые данные.

**Backend (Flask + API + БД)**

- `feat(api): implement /api/answer` — `POST {question_id, answer_index, time_left}`: сервер получает вопрос, проверяет правильность, вычисляет `gained_score` через `quiz_engine.calculate_score`, обновляет `game_sessions` (или текущую сессию), возвращает `{correct, gained_score, total_score}`.

- `feat(db): add indices and fk` — добавить `FOREIGN KEY user_id` -> `users.id`, индексы на `score`, `created_at`.

- `fix(security): session check` — все POST проверяют соответствие `user_id` в сессии.
Критерий приёмки: отправка корректного ответа увеличивает game_sessions.score в БД; ответ API содержит total_score.

**Игровая логика + Frontend (JS)**

- `feat(js): integrate server /api/answer` — заменить заглушку на реальный вызов, обновлять UI по ответу сервера.

- `feat(js): robust timer` — при 0 автоматически вызывается submitAnswer с `time_left=0`, блокировка повторных кликов.

- `feat(quiz): server-question format` — привести формат вопросов к единому JSON, добавление `question_id`в payload.
Критерий приёмки: при ответе UI получает от сервера gained_score и total_score и показывает их.

**Верстальщик / UI-дизайнер**

- `style: responsive polish` — медиазапросы, корректные размеры кнопок и шрифтов для мобильных.

- `accessibility: basic `— ARIA для кнопок, Enter/Space работают для выбора.
Критерий приёмки: финальный экран показывает итог и таблицу лидеров обновляется.

### Спринт 4 — Тестирование, багфиксы, документация и релиз

**DoD(Definition of Done)**: критические баги устранены; есть unit-тесты на логику начисления очков и на API; README и инструкции обновлены.

Общие задачи (всем распределять по необходимости)

**Backend (Flask + API + БД)**

- `perf/db`: проверить запрос `leaderboard`, оптимизировать `ORDER BY (score DESC, created_at ASC)`.

- `chore: logging & error handling` — добавить логи и корректные коды ошибок.

- `chore: finalize README & docs` — инструкция по запуску, описание API и схемы БД.

**Игровая логика + Frontend (JS)**

- `perf/js`: минимизация лишних перерисов, lazy-load вопросов.

- `test`: расширить unit-тесты покрытия граничных значений.

- `test: add unit tests` — тесты для `quiz_engine.calculate_score` (несколько кейсов) и для `/api/answer (sqlite in-memory)`.

**Верстальщик / UI-дизайнер**

- `ux: usability test` — провести 3-5 сессий с пользователями, собрать баг-лист и приоритетно исправить.

- `style: final polish` — мелкие правки по цветам/контрасту/отступам.

- `fix: cross-browser bugs` — проверка и исправление на Chrome/Firefox/Edge и мобильных.

## 6. Используемые инструменты
- Python 3 + Flask
- SQLite
- HTML, CSS, JavaScript
- GitHub (репозиторий, Issues, Pull Requests)
