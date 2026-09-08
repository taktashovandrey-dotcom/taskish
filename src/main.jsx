import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const root = createRoot(document.getElementById('root'))
root.render(<App />)

// unregister any existing service workers (dev-only safe cleanup)
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.getRegistrations().then(regs => {
		regs.forEach(r => r.unregister().catch(()=>{}))
	}).catch(()=>{})
}
