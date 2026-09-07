import React from 'react'

export default function SuggestionModal({ open, suggestion, onClose, onApply }) {
  if (!open) return null
  return (
    <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',zIndex:60}}>
      <div style={{width:'min(720px,95%)',background:'#071428',padding:16,borderRadius:8,border:'1px solid #233240'}}>
        <h3>Предложения ИИ</h3>
        <pre style={{whiteSpace:'pre-wrap',color:'#e6eef8'}}>{suggestion}</pre>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
          <button onClick={onClose} style={{padding:'8px 12px'}}>Закрыть</button>
          <button onClick={onApply} style={{padding:'8px 12px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:6}}>Применить</button>
        </div>
      </div>
    </div>
  )
}
