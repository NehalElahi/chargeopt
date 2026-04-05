/**
 * Base URL for the Express API (no trailing slash).
 * - Local dev with `npm run dev`: leave unset → same-origin `/api/...`
 * - Vercel (or any static host): set `VITE_API_URL` to your API origin, e.g. `https://your-api.railway.app`
 */
const raw = import.meta.env.VITE_API_URL?.trim() ?? "";
const base = raw.replace(/\/$/, "");

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
