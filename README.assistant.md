# Assistant push — тест и инструкция

Этот файл предназначен для демонстрации работы workflow `Assistant Push`.

Как работает (коротко):
- Workflow `Assistant Push` запускается вручную (workflow_dispatch).
- При запуске выполняется `.github/assistant/assistant-apply.sh`, который копирует содержимое папки `.assistant/pending/` в корень репозитория.
- После копирования workflow делает `git add`, `git commit` и `git push` используя секрет `ASSISTANT_PAT`.

Тест (пошагово):
1. Немедленно отозовите любой раскрытый PAT (см. предупреждение ниже).
2. Создайте новый PAT в GitHub (scope: `repo` минимум) и сохраните значение (ни в коем случае не публикуйте).
3. В репозитории: Settings → Secrets and variables → Actions → New repository secret. Назовите его `ASSISTANT_PAT` и вставьте новый PAT.
4. Закоммитьте и запушьте файлы (включая эти `.assistant/pending/*`) в репозиторий:

```powershell
cd "c:\Users\takta\ЗАдачник"
git add .assistant/pending/* .github/workflows/assistant-push.yml .github/assistant/assistant-apply.sh
git commit -m "Add assistant pending test and workflow"
git push
```

5. Откройте GitHub → Actions → выберите `Assistant Push` → Run workflow → выберите ветку и нажмите Run.
6. В логах workflow найдите шаг `Run assistant apply script` — он должен показать копирование файлов.
7. Если workflow найдёт изменения, он сделает `git commit` и `git push`; проверьте историю коммитов на GitHub и наличие скопированных файлов в корне.

Важно — безопасность:
- Если вы случайно вставили PAT в чат (как в предыдущем сообщении), немедленно отозовите этот токен в GitHub (Developer settings → Personal access tokens) и удалите/пересоздайте репозиторный secret `ASSISTANT_PAT`.
- Никогда не публикуйте PAT в чате.

Если нужно, могу расширить скрипт, чтобы он создавал PR вместо прямого пуша или выполнял сборку и публиковал `dist/` в `gh-pages`.
