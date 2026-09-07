# Taskish — быстрый задачник (прототип)

Лёгкий PWA-прототип для быстрого добавления задач с NL-парсингом и локальным хранением.

Запуск локально:

```bash
npm install
npm run dev
```

Деплой на GitHub Pages:

- Сборка: `npm run build`
- Опубликуйте папку `dist/` на ветке `gh-pages` или настройте GitHub Pages для ветки `main` и папки `/docs`.

Замечания:
- Уведомления реализованы через `Notification` API и будут работать, когда сайт открыт в браузере. Для фоновых пушей требуется серверный компонент (push subscription).
- Синхронизация между устройствами планируется через Supabase/Firebase — добавлю позже.
 - Уведомления реализованы через `Notification` API и будут работать, когда сайт открыт в браузере. Для фоновых пушей требуется серверный компонент (push subscription).
 - Синхронизация между устройствами реализована через Supabase (опция). Используется стратегия merge по `updated_at`: локальные изменения сохраняются, удалённые изменения с более поздним `updated_at` перезаписывают локальные.

Бюджет и бесплатность
- Сам проект и деплой на GitHub Pages бесплатны.
- Supabase имеет бесплатный тариф, который подходит для личного использования; OpenAI — платная опция по использованию API (опционально, ключ вводишь только ты).

UX и полезные фишки
- Быстрый ввод: поле на главной странице, нажми Enter или шорткат `Ctrl/Cmd+K` чтобы фокусироваться на вводе.
- Кнопка `AI` рядом с задачей вызывает подсказки ИИ и предлагает приоритет и шаги; результаты можно применить к задаче.
 - Автосинхронизация: в настройках можно включить `Автосинхронизация` и задать интервал в минутах — приложение будет автоматически синхронизировать данные с Supabase (если настроен).
 - Авто‑ИИ: в настройках можно включить `Автопросмотр ИИ при добавлении задачи` — тогда при создании новой задачи будет автоматически запрашиваться подсказка от OpenAI. Опцию `Автоприменять предложения ИИ` можно включить, чтобы автоматически применять приоритет и текст предложения к задаче (внимание: использование OpenAI оплачивается по тарифу).

Supabase и OpenAI (опционально)
- Чтобы включить синхронизацию через Supabase:
	1. Создайте проект на https://supabase.com
	2. Создайте таблицу `tasks` с полями совместимыми с моделью (id text primary key, title text, description text, created_at timestamptz, due text, priority text, tags jsonb, done boolean, notified boolean)
	3. Вставьте `SUPABASE_URL` и `SUPABASE_ANON_KEY` в Настройки внутри приложения (они сохраняются локально)
	4. Нажмите `Sync Up` чтобы загрузить локальные задачи или `Sync Down` чтобы загрузить удалённые.

- Чтобы использовать AI-предложения: получите OpenAI API key и вставьте его в Настройки -> OpenAI API Key. Кнопка `AI` рядом с задачей сделает запрос к OpenAI и покажет предложение.

Publishing to GitHub Pages (one-time setup)

1. Create a new repository on GitHub (you can name it `taskish`) or use the steps below to create a remote and push.
2. From your local project folder run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

After pushing, GitHub Actions (workflow `.github/workflows/deploy.yml`) will build the project and publish the `dist/` to GitHub Pages. In repository settings -> Pages, set the source to `GitHub Actions` if needed.

Notes about costs and privacy
- The site can be used fully locally without any external keys. Supabase is optional (free tier available). OpenAI requires an API key and will incur costs when used.

