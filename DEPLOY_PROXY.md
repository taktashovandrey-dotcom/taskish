# Deploying the OpenAI proxy (Netlify)

This repository includes a Netlify-compatible serverless function at `netlify/functions/openai-proxy.js` and a Vercel example at `api/openai-proxy.js`.

Quick steps to deploy to Netlify:

1. Create a Netlify site and link the repository in Netlify (or use the Netlify UI to connect GitHub).
2. In the repository's GitHub Secrets, add:
   - `NETLIFY_AUTH_TOKEN` — a Personal Access Token from Netlify (Team → User settings → Applications)
   - `NETLIFY_SITE_ID` — the Site ID for the Netlify site
3. (Optional) Set `PROXY_SECRET` in Netlify environment variables and copy the same value into the app Settings `Proxy secret`.
4. (Required) Set `OPENAI_API_KEY` in Netlify environment variables (do NOT commit your key).
5. On GitHub go to Actions → `Deploy OpenAI Proxy to Netlify` and click `Run workflow` (workflow_dispatch). The workflow will build the app and deploy `dist/`.

Notes:
- `netlify.toml` configures the functions folder: `netlify/functions`.
- After deployment, you'll have a function endpoint like `https://<your-site>.netlify.app/.netlify/functions/openai-proxy`.
- Paste that full URL into the app Settings `OpenAI proxy URL` and save. If you used `PROXY_SECRET`, set it in Settings too.

If you prefer Vercel, connect the repo in Vercel and set `OPENAI_API_KEY` and optional `PROXY_SECRET` in Vercel project settings. Vercel will auto-deploy on push.
