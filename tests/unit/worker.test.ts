import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error -- plain JS Worker module, no type declarations
import worker, { SECURITY_HEADERS } from '../../worker/index.js';

type Env = { API_ORIGIN?: string; ORIGIN_SHARED_SECRET?: string; ASSETS: { fetch: (r: Request) => Promise<Response> } };

const assets = { fetch: async () => new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } }) };
const env = (over: Partial<Env> = {}): Env => ({
  API_ORIGIN: 'http://api.internal', ORIGIN_SHARED_SECRET: 'k'.repeat(40), ASSETS: assets, ...over,
});

afterEach(() => vi.unstubAllGlobals());

function captureUpstream() {
  const seen: Request[] = [];
  vi.stubGlobal('fetch', async (req: Request) => {
    seen.push(req);
    return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
  });
  return seen;
}

describe('Cloudflare Worker', () => {
  it('proxies /api with the origin secret, overwriting anything the visitor sent', async () => {
    const seen = captureUpstream();
    const req = new Request('https://shop.example/api/products?x=1', {
      headers: { 'X-Origin-Auth': 'forged', 'CF-Connecting-IP': '203.0.113.7', 'X-Forwarded-For': '1.2.3.4' },
    });
    await worker.fetch(req, env());
    const up = seen[0]!;
    expect(up.url).toBe('http://api.internal/api/products?x=1');
    expect(up.headers.get('X-Origin-Auth')).toBe('k'.repeat(40));
    // Rate limits key on Cloudflare's view of the visitor, not a forged header.
    expect(up.headers.get('X-Forwarded-For')).toBe('203.0.113.7');
  });

  it('never forwards a visitor-supplied origin secret when none is configured', async () => {
    const seen = captureUpstream();
    await worker.fetch(new Request('https://shop.example/api/x', { headers: { 'X-Origin-Auth': 'forged' } }), env({ ORIGIN_SHARED_SECRET: undefined }));
    expect(seen[0]!.headers.get('X-Origin-Auth')).toBeNull();
  });

  it('serves pages with strict security headers', async () => {
    const res = await worker.fetch(new Request('https://shop.example/product/abc'), env());
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(res.headers.get(name)).toBe(value);
    const csp = res.headers.get('Content-Security-Policy')!;
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('unsafe-eval');
  });

  it('the static-asset _headers file sets exactly the same security headers', async () => {
    // Cloudflare serves pages without running the Worker, so public/_headers
    // is what actually protects them. It must not drift from the Worker list.
    const { readFileSync } = await import('node:fs');
    const text = readFileSync(`${process.cwd()}/public/_headers`, 'utf8');
    const lines = text.split('\n').filter((l) => /^\s+\S/.test(l)).map((l) => l.trim());
    const fromFile = Object.fromEntries(lines.map((l) => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1).trim()]));
    expect(text).toMatch(/^\/\*$/m);
    expect(fromFile).toEqual(SECURITY_HEADERS);
  });

  it('answers a clear 503 when the API origin is not configured', async () => {
    const res = await worker.fetch(new Request('https://shop.example/api/products'), env({ API_ORIGIN: undefined }));
    expect(res.status).toBe(503);
  });
});
