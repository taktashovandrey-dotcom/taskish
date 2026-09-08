# Taskish — quick task PWA

Minimal prototype for quick tasks with optional Supabase sync and AI suggestions.

Quick start (dev):

```powershell
cd "c:\Users\takta\ЗАдачник"
npm ci
npm run dev
```

Build and deploy (locally):

```powershell
npm run build
# serve the dist/ folder with any static server
```

GitHub Pages deploy is configured via Actions (`.github/workflows/deploy-gh-pages.yml`). The workflow builds and deploys `dist/` to the `gh-pages` branch on push to `main`.

Assistant automation
- `.github/workflows/assistant-push.yml` creates PRs from files placed into `.assistant/pending/`.
- The assistant can be configured to run nightly; changes are proposed as PRs for review.

Supabase
- Create a Supabase project and a table `tasks` with columns matching the task shape: `id text primary key`, `title text`, `description text`, `created_at timestamp`, `updated_at timestamp`, `due timestamp`, `priority text`, `tags text[]`, `done boolean`, `notified boolean`.
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your app settings or save in local settings in the UI.

OpenAI
- The app supports client-side OpenAI keys stored locally in the browser settings. For production, consider a server-side proxy to avoid exposing keys.

Security note
- If any PAT was exposed, revoke it immediately in GitHub Settings → Developer settings → Personal access tokens.
- Store secrets only in GitHub Secrets or environment variables — never in code or chat.

If you want, I will continue by finishing UX polish, wiring Supabase end-to-end, and adding an optional serverless proxy for OpenAI suggestions.
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

