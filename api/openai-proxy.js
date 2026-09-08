// Vercel serverless function: api/openai-proxy.js
// Expects POST JSON body forwarded to OpenAI chat completions API.
// Protect with environment variables: OPENAI_API_KEY and optional PROXY_SECRET.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const proxySecret = process.env.PROXY_SECRET
  const headerSecret = req.headers['x-proxy-secret'] || req.headers['x-proxy-key']
  if (proxySecret && headerSecret !== proxySecret) {
    return res.status(401).json({ error: 'Unauthorized (invalid proxy secret)' })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' })

  try {
    const body = req.body || {}
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    })
    const data = await resp.json()
    return res.status(resp.status).json(data)
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) })
  }
}
