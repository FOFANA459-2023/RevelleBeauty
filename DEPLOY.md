# Deploying the storefront to Cloudflare Pages

The CI pipeline auto-deploys `main` once two repository secrets exist
(Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create → "Edit Cloudflare Workers"-style token with **Pages: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → any zone → right sidebar |

Then create the Pages project once (or let the first deploy create it):

```bash
npx wrangler pages project create revellebeauty --production-branch=main
```

## Pointing the SPA at the API

Set a repository **variable** `VITE_API_BASE_URL` (Settings → Secrets and
variables → Actions → Variables tab):

- **Recommended — same-origin routing:** leave it as `/api` and route
  `yourdomain.com/api/*` to the backend at the Cloudflare edge (a Worker
  route or an Origin Rule that forwards `/api/*` and `/uploads/*` to the
  backend host). One origin, zero CORS, cookies just work.
- **Split origins:** set it to `https://api.yourdomain.com/api`. Then on the
  backend set `CORS_ORIGINS=https://yourdomain.com` and keep both hosts on
  the same registrable domain — the session cookies are `SameSite=Lax/Strict`
  and will only flow within the same site.

## SPA fallback

`public/_redirects` (`/* /index.html 200`) ships with the build so deep links
like `/product/high-shine-lip-oil` resolve client-side. Don't delete it.
