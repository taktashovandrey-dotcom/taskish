import localforage from 'localforage'

const store = localforage.createInstance({
  name: 'taskish'
})

export async function saveTasks(tasks) {
  // ensure updated_at exists for tasks
  const normalized = tasks.map(t => ({ ...t, updated_at: t.updated_at || new Date().toISOString() }))
  await store.setItem('tasks', normalized)
}

export async function loadTasks() {
  const t = await store.getItem('tasks')
  return t || []
}

export default store
