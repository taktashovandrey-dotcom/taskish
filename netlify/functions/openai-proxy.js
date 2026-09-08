// Netlify function: netlify/functions/openai-proxy.js
const fetch = globalThis.fetch || require('node-fetch')

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }

  const proxySecret = process.env.PROXY_SECRET
  const headerSecret = (event.headers['x-proxy-secret'] || event.headers['x-proxy-key'] || '')
  if (proxySecret && headerSecret !== proxySecret) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized (invalid proxy secret)' }) }
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Server missing OPENAI_API_KEY' }) }

  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    })
    const data = await resp.json()
    return { statusCode: resp.status, body: JSON.stringify(data) }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) }
  }
}
