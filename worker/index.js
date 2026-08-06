/**
 * Cloudflare Worker in front of the static SPA.
 *
 * Purpose: keep the API on the SAME ORIGIN as the site. The customer and
 * admin session cookies are SameSite=Lax/Strict, so a browser will not send
 * them to a different site — putting the API on its own domain would silently
 * break sign-in. Proxying /api/* and /uploads/* from this origin avoids that
 * (and removes CORS entirely).
 *
 * Set the API_ORIGIN var to the deployed backend, e.g.
 *   npx wrangler secret put API_ORIGIN      (or a plain var in wrangler.jsonc)
 * Until it is set, API calls return a clear 503 instead of SPA HTML — an
 * HTML body would surface as a confusing JSON parse error in the UI.
 */

const PROXY_PREFIXES = ['/api/', '/uploads/'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (PROXY_PREFIXES.some((p) => url.pathname.startsWith(p))) {
      if (!env.API_ORIGIN) {
        return Response.json(
          {
            error: {
              code: 'api_not_configured',
              message: 'API_ORIGIN is not set on this Worker.',
            },
          },
          { status: 503 },
        );
      }

      const origin = new URL(env.API_ORIGIN);
      const target = new URL(url.pathname + url.search, origin);

      // Preserve method, headers, body, and cookies; same-origin from the
      // browser's perspective, so credentials flow normally.
      const proxied = new Request(target, request);
      proxied.headers.set('X-Forwarded-Host', url.host);
      proxied.headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

      return fetch(proxied, { redirect: 'manual' });
    }

    // Everything else: static assets, with SPA fallback for deep links.
    return env.ASSETS.fetch(request);
  },
};
