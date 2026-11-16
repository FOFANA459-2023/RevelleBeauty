/**
 * Cloudflare Worker in front of the static SPA.
 *
 * 1. Same origin. The session cookie is SameSite=Lax, so the API must live on
 *    the site's own origin: /api/* and /uploads/* are proxied to the backend
 *    (API_ORIGIN), which also removes CORS entirely.
 *
 * 2. Origin lock. Every proxied request carries X-Origin-Auth with the
 *    ORIGIN_SHARED_SECRET Worker secret; the backend refuses anything without
 *    it, so nobody can reach the API around Cloudflare. Whatever a visitor
 *    sends in that header is overwritten.
 *
 * 3. Real client IP. X-Forwarded-For is replaced by Cloudflare's own
 *    CF-Connecting-IP, so rate limits key on the visitor's true address and a
 *    forged header can't reset them.
 *
 * 4. Security headers on every page: a strict Content-Security-Policy (the
 *    site loads nothing from third parties; payment happens on Stripe's own
 *    page), HSTS, no framing (clickjacking), no MIME sniffing, a tight
 *    referrer and permissions policy.
 *
 *   npx wrangler secret put ORIGIN_SHARED_SECRET   (same value as the backend)
 */

const PROXY_PREFIXES = ['/api/', '/uploads/'];

export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

function withSecurityHeaders(response) {
  const res = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.headers.set(name, value);
  return res;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (PROXY_PREFIXES.some((p) => url.pathname.startsWith(p))) {
      if (!env.API_ORIGIN) {
        return Response.json(
          { error: { code: 'api_not_configured', message: 'API_ORIGIN is not set on this Worker.' } },
          { status: 503 },
        );
      }

      const target = new URL(url.pathname + url.search, new URL(env.API_ORIGIN));

      // Method, body and cookies pass through; same-origin from the browser's
      // point of view, so credentials flow normally.
      const proxied = new Request(target, request);
      proxied.headers.set('X-Forwarded-Host', url.host);
      proxied.headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
      const clientIp = request.headers.get('CF-Connecting-IP');
      if (clientIp) proxied.headers.set('X-Forwarded-For', clientIp);
      else proxied.headers.delete('X-Forwarded-For');
      if (env.ORIGIN_SHARED_SECRET) proxied.headers.set('X-Origin-Auth', env.ORIGIN_SHARED_SECRET);
      else proxied.headers.delete('X-Origin-Auth');

      const upstream = await fetch(proxied, { redirect: 'manual' });
      // API answers keep their own headers (helmet); only add what's missing.
      const res = new Response(upstream.body, upstream);
      for (const name of ['Strict-Transport-Security', 'X-Content-Type-Options']) {
        if (!res.headers.has(name)) res.headers.set(name, SECURITY_HEADERS[name]);
      }
      return res;
    }

    // Everything else: static assets, with SPA fallback for deep links.
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
