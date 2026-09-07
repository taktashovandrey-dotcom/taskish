import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const root = createRoot(document.getElementById('root'))
try {
	root.render(<App />)
	// mark app mounted for fallback detection
	window.__appMounted = true
} catch (e) {
	// show simple error UI if React render fails
	const el = document.getElementById('root')
	if (el) el.innerHTML = '<pre style="color:#c00;background:#111;padding:12px;border-radius:6px">App render error:\n' + (e && e.message) + '</pre>'
	console.error('Render error', e)
}

// unregister any existing service workers (dev-only safe cleanup)
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.getRegistrations().then(regs => {
		regs.forEach(r => r.unregister().catch(()=>{}))
	}).catch(()=>{})
}
