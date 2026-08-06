# Deploying the storefront to Cloudflare

This project deploys as a **Cloudflare Worker with static assets** (`wrangler
deploy`), not Cloudflare Pages. The config lives in `wrangler.jsonc`.

> **Do not add a `_redirects` file.** That is Pages syntax. Workers rejects
> `/* /index.html 200` with *"Infinite loop detected in this rule"*. SPA deep
> links are handled by `assets.not_found_handling: "single-page-application"`
> in `wrangler.jsonc` instead.

## Two ways to deploy — pick ONE

**A. Cloudflare Git integration (what you're using now).**
Cloudflare clones the repo, runs `npm run build`, then `npx wrangler deploy`.
Nothing else to configure. Leave the GitHub secrets below **unset** so the
Actions deploy job stays skipped and you don't get two competing deploys of
the same commit.

**B. GitHub Actions.** Add two repo secrets (Settings → Secrets and variables
→ Actions) and the `Deploy` job takes over:

| Secret | Where |
|---|---|
| `CLOUDFLARE_API_TOKEN` | My Profile → API Tokens → template with **Workers Scripts: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard sidebar |

If you use B, disconnect the Git integration in the Cloudflare dashboard.

## Connecting the storefront to the API

`worker/index.js` proxies `/api/*` and `/uploads/*` to the backend, so the
browser sees **one origin**.

**This is not a convenience — it is required for sign-in to work.** The
customer and admin session cookies are `SameSite=Lax` / `SameSite=Strict`.
A browser will not send those to a different site, so hosting the API on a
separate domain silently breaks login and checkout. Proxying keeps everything
same-origin (and eliminates CORS entirely).

Once the backend is deployed, point the Worker at it:

```bash
# One-off, or edit the "vars" block in wrangler.jsonc and redeploy
npx wrangler deploy --var API_ORIGIN:https://api.revellebeauty.com
```

Until `API_ORIGIN` is set, `/api/*` returns a clear
`503 {"error":{"code":"api_not_configured"}}` rather than SPA HTML — an HTML
body would surface in the UI as a confusing JSON parse error.

Leave `VITE_API_BASE_URL` at its default `/api`. Only override it (repo
variable) if you deliberately want the SPA to call an absolute URL, in which
case you must also solve the cookie problem above.

## Custom domain

Cloudflare dashboard → Workers & Pages → `revellebeauty` → Settings → Domains
& Routes → Add custom domain. Keeping the site and API on the same registrable
domain is the safest arrangement.
