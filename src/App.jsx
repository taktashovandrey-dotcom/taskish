import React, { useEffect, useState, useRef } from 'react'
import * as chrono from 'chrono-node'
import { loadTasks, saveTasks } from './db'
import localforage from 'localforage'
import { initSupabase, getSupabase } from './supabaseClient'
import SuggestionModal from './SuggestionModal'

function parseInput(text) {
  // Try to extract date/time via chrono
  const results = chrono.parse(text)
  let due = null
  if (results && results.length > 0) {
    due = results[0].start.date()
    // remove recognized text from title
    const index = results[0].index
    const len = results[0].text.length
    const title = (text.slice(0, index) + text.slice(index + len)).trim()
    return { title: title || text, due }
  }
  return { title: text, due }
}

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString()
  } catch {
    return ''
  }
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [input, setInput] = useState('')
  const checkRef = useRef(null)

  useEffect(() => {
    loadTasks().then(t => setTasks(t))
    // load saved settings
    localforage.getItem('settings').then(s => {
      if (s) {
        setSettings(s)
        if (s.supabaseUrl && s.supabaseKey) initSupabase(s.supabaseUrl, s.supabaseKey)
      }
    })

    // keyboard shortcut for quick add (Ctrl/Cmd+K)
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const el = document.querySelector('.quick-add input')
        if (el) { e.preventDefault(); el.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  useEffect(() => {
    // request notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'default') Notification.requestPermission()
    }

    // check every 30s for due tasks
    checkRef.current = setInterval(() => {
      const now = new Date()
      setTasks(prev => {
        const updated = prev.map(t => {
          if (!t.done && t.due && !t.notified && new Date(t.due) <= now) {
            // show notification
            if (Notification.permission === 'granted') {
              try {
                new Notification(t.title, { body: t.description || 'Напоминание', tag: t.id })
              } catch (e) {
                console.warn('Notification failed', e)
              }
            }
            return { ...t, notified: true }
          }
          return t
        })
        if (JSON.stringify(prev) !== JSON.stringify(updated)) saveTasks(updated)
        return updated
      })
    }, 30000)

    return () => clearInterval(checkRef.current)
  }, [])

  function addTaskFromInput() {
    if (!input.trim()) return
    const { title, due } = parseInput(input)
    const newTask = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title,
      description: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due: due ? due.toISOString() : null,
      priority: 'medium',
      tags: [],
      done: false,
      notified: false
    }
    setTasks(prev => [newTask, ...prev])
    setInput('')

    // Optionally trigger AI suggestion automatically for the new task
    ;(async () => {
      try {
        const s = settings || (await localforage.getItem('settings'))
        if (s?.autoAi && s?.openaiKey) {
          const text = await fetchAISuggestionText(newTask, s.openaiKey)
          if (s.autoAiApply) {
            const prioMatch = text.match(/\b(low|medium|high)\b/i)
            const priority = prioMatch ? prioMatch[1].toLowerCase() : 'medium'
            setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, priority, description: (t.description || '') + '\n' + text, updated_at: new Date().toISOString() } : t))
          } else {
            setSuggestionText(text)
            setSuggestionTarget(newTask)
            setSuggestionOpen(true)
          }
        }
      } catch (e) {
        console.warn('Auto AI suggestion failed', e)
      }
    })()
  }

  // Settings and sync
  const [settings, setSettings] = useState({ supabaseUrl: '', supabaseKey: '', openaiKey: '', autoSync: false, autoSyncInterval: 5, autoAi: false, autoAiApply: false })

  async function saveSettings() {
    await localforage.setItem('settings', settings)
    if (settings.supabaseUrl && settings.supabaseKey) initSupabase(settings.supabaseUrl, settings.supabaseKey)
    alert('Настройки сохранены')
  }

  // periodic auto-sync when enabled (uses Supabase credentials from settings)
  useEffect(() => {
    let id = null
    if (settings.autoSync && settings.supabaseUrl && settings.supabaseKey) {
      if (!getSupabase()) initSupabase(settings.supabaseUrl, settings.supabaseKey)
      const minutes = Math.max(1, parseInt(settings.autoSyncInterval || 5, 10))
      id = setInterval(() => {
        // upload local then merge remote
        syncUp().catch(() => {})
        syncDown().catch(() => {})
      }, minutes * 60 * 1000)
    }
    return () => { if (id) clearInterval(id) }
  }, [settings.autoSync, settings.autoSyncInterval, settings.supabaseUrl, settings.supabaseKey])

  async function syncDown() {
    const supabase = getSupabase()
    if (!supabase) return alert('Подключитесь к Supabase в настройках')
    const { data, error } = await supabase.from('tasks').select('*')
    if (error) return alert('Ошибка синхронизации: ' + error.message)
    if (data) {
      // merge remote and local by id and updated_at
      const local = await loadTasks()
      const map = new Map()
      local.forEach(t => map.set(t.id, t))
      data.forEach(rt => {
        const lt = map.get(rt.id)
        if (!lt) map.set(rt.id, rt)
        else {
          const rUp = new Date(rt.updated_at || rt.created_at)
          const lUp = new Date(lt.updated_at || lt.created_at)
          if (rUp > lUp) map.set(rt.id, rt)
        }
      })
      const merged = Array.from(map.values()).sort((a,b)=> new Date(b.created_at)-new Date(a.created_at))
      setTasks(merged)
      saveTasks(merged)
      alert('Синхронизировано: локальные и удалённые данные объединены')
    }
  }

  async function syncUp() {
    const supabase = getSupabase()
    if (!supabase) return alert('Подключитесь к Supabase в настройках')
    // ensure updated_at present
    const payload = tasks.map(t => ({ ...t, updated_at: t.updated_at || new Date().toISOString() }))
    const { data, error } = await supabase.from('tasks').upsert(payload)
    if (error) return alert('Ошибка загрузки: ' + error.message)
    alert('Синхронизировано')
  }

  // AI suggestion handling
  const [suggestionOpen, setSuggestionOpen] = useState(false)
  const [suggestionText, setSuggestionText] = useState('')
  const [suggestionTarget, setSuggestionTarget] = useState(null)

  // fetch suggestion text from OpenAI (returns string)
  async function fetchAISuggestionText(task, key) {
    const prompt = `Анализ задачи: "${task.title}". Предложи приоритет (low/medium/high), 3 шага для выполнения, и примерное время в минутах для каждого шага.`
    // If a server-side proxy URL is set in settings, use it (safer: keeps OpenAI key on server)
    const s = settings || (await localforage.getItem('settings'))
    if (s?.openaiProxyUrl) {
      const headers = { 'Content-Type': 'application/json' }
      if (s.openaiProxySecret) headers['x-proxy-secret'] = s.openaiProxySecret
      const resp = await fetch(s.openaiProxyUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 400 })
      })
      const j = await resp.json()
      return j?.choices?.[0]?.message?.content || JSON.stringify(j)
    }

    // Fallback: direct client-side call (requires user-provided OpenAI key)
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 400 })
    })
    const j = await resp.json()
    return j?.choices?.[0]?.message?.content || JSON.stringify(j)
  }

  async function aiSuggest(task) {
    const s = settings || (await localforage.getItem('settings'))
    const key = s?.openaiKey
    if (!key) return alert('Укажи OpenAI API key в настройках (он хранится локально)')
    try {
      const text = await fetchAISuggestionText(task, key)
      setSuggestionText(text)
      setSuggestionTarget(task)
      setSuggestionOpen(true)
    } catch (e) {
      alert('Ошибка ИИ: ' + e.message)
    }
  }

  function applySuggestion() {
    if (!suggestionTarget) return setSuggestionOpen(false)
    const prioMatch = suggestionText.match(/\b(low|medium|high)\b/i)
    const priority = prioMatch ? prioMatch[1].toLowerCase() : 'medium'
    setTasks(prev => prev.map(t => t.id === suggestionTarget.id ? { ...t, priority, description: (t.description || '') + '\n' + suggestionText, updated_at: new Date().toISOString() } : t))
    setSuggestionOpen(false)
  }

  function toggleDone(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done, updated_at: new Date().toISOString() } : t))
  }

  function removeTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function snooze(id, minutes = 10) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const due = t.due ? new Date(t.due) : new Date()
      due.setMinutes(due.getMinutes() + minutes)
      return { ...t, due: due.toISOString(), notified: false, updated_at: new Date().toISOString() }
    }))
  }

  return (
    <div className="app">
      <header>
        <h1>Taskish</h1>
        <p>Быстрое добавление задач — напиши, например: «Забрать посылку завтра в 18:00»</p>
      </header>

      <section className="quick-add">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTaskFromInput() }}
          placeholder="Добавить задачу (Enter чтобы сохранить)"
        />
        <button onClick={addTaskFromInput}>Добавить</button>
      </section>

      <section className="tasks">
        <h2>Список</h2>
        {tasks.length === 0 && <p>Пусто — добавь первую задачу</p>}
        <ul>
          {tasks.map(t => (
            <li key={t.id} className={t.done ? 'done' : ''}>
              <div className="task-main">
                <input type="checkbox" checked={t.done} onChange={() => toggleDone(t.id)} />
                <div className="task-content">
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">{t.due ? formatDate(t.due) : 'Без срока'}
                    <span className={`priority-badge priority-${t.priority||'medium'}`}>{t.priority}</span>
                  </div>
                </div>
              </div>
              <div className="task-actions">
                <button onClick={() => snooze(t.id, 10)}>Snooze 10m</button>
                <button onClick={() => aiSuggest(t)}>AI</button>
                <button onClick={() => removeTask(t.id)}>Удалить</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="settings">
        <h2>Настройки и синхронизация</h2>
        <div style={{display:'grid',gap:8,maxWidth:640}}>
          <input value={settings.supabaseUrl} onChange={e=>setSettings({...settings,supabaseUrl:e.target.value})} placeholder="Supabase URL (если есть)" />
          <input value={settings.supabaseKey} onChange={e=>setSettings({...settings,supabaseKey:e.target.value})} placeholder="Supabase ANON KEY" />
          <div style={{display:'flex',gap:8}}>
            <button onClick={saveSettings}>Сохранить настройки</button>
            <button onClick={syncDown}>Sync Down</button>
            <button onClick={syncUp}>Sync Up</button>
          </div>
          <label style={{display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={settings.autoSync} onChange={e=>setSettings({...settings,autoSync:e.target.checked})} /> Автосинхронизация</label>
          <label style={{display:'flex',gap:8,alignItems:'center'}}><span>Интервал (мин):</span><input type="number" min={1} value={settings.autoSyncInterval} onChange={e=>setSettings({...settings,autoSyncInterval:e.target.value})} style={{width:80}} /></label>
          <hr />
          <input value={settings.openaiProxyUrl || ''} onChange={e=>setSettings({...settings,openaiProxyUrl:e.target.value})} placeholder="OpenAI proxy URL (e.g. https://site.vercel.app/api/openai-proxy)" />
          <input value={settings.openaiProxySecret || ''} onChange={e=>setSettings({...settings,openaiProxySecret:e.target.value})} placeholder="Proxy secret (если используетcя)" />
          <input value={settings.openaiKey} onChange={e=>setSettings({...settings,openaiKey:e.target.value})} placeholder="OpenAI API Key (по желанию, используется если proxy не указан)" />
          <label style={{display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={settings.autoAi} onChange={e=>setSettings({...settings,autoAi:e.target.checked})} /> Автопросмотр ИИ при добавлении задачи</label>
          <label style={{display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={settings.autoAiApply} onChange={e=>setSettings({...settings,autoAiApply:e.target.checked})} /> Автоприменять предложения ИИ (внимание: может расходовать токены)</label>
          <small>Ключ хранится локально в браузере и не отправляется на сервер проекта, если не указан proxy. Proxy рекомендуется для безопасности.</small>
        </div>
      </section>
      <SuggestionModal open={suggestionOpen} suggestion={suggestionText} onClose={()=>setSuggestionOpen(false)} onApply={applySuggestion} />

      <footer>
        <small>ПWA prototype — синхронизация и ИИ будут добавлены позже.</small>
      </footer>
    </div>
  )
}
