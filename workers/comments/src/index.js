// Anonymous blog comments. Readers need no account.
//   GET    /comments?slug=<slug>   list visible comments for a post
//   POST   /comments               {slug, name?, body, website (honeypot), elapsed (ms on page)}
//   DELETE /comments/<id>          Authorization: Bearer <ADMIN_TOKEN>  (soft delete)
// Spam guards: honeypot field, minimum time on page, link limit, per-IP rate limit,
// and a check that the slug is a real post on the site.

const MINUTE = 60_000;
const LIMITS = { name: 60, body: 5000, links: 2, perTenMin: 5, perDay: 30, minElapsed: 3000 };

export default {
  async fetch(req, env) {
    const cors = corsHeaders(req, env);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    try {
      if (url.pathname === "/comments" && req.method === "GET") return list(url, env, cors);
      if (url.pathname === "/comments" && req.method === "POST") return await create(req, env, cors);
      const m = url.pathname.match(/^\/comments\/(\d+)$/);
      if (m && req.method === "DELETE") return await remove(req, env, cors, Number(m[1]));
      return json({ error: "not found" }, 404, cors);
    } catch (err) {
      console.error(err);
      return json({ error: "server error" }, 500, cors);
    }
  },
};

async function list(url, env, cors) {
  const slug = url.searchParams.get("slug") ?? "";
  if (!validSlug(slug)) return json({ error: "bad slug" }, 400, cors);
  const { results } = await env.DB.prepare(
    "SELECT id, name, body, created_at FROM comments WHERE slug = ? AND deleted = 0 ORDER BY created_at ASC LIMIT 500"
  ).bind(slug).all();
  return json({ comments: results }, 200, { ...cors, "Cache-Control": "no-store" });
}

async function create(req, env, cors) {
  let data;
  try { data = await req.json(); } catch { return json({ error: "bad request" }, 400, cors); }
  const slug = String(data.slug ?? "");
  const name = String(data.name ?? "").trim().slice(0, LIMITS.name) || "Anonymous";
  const body = String(data.body ?? "").trim();

  // Bots fill every field and post instantly; pretend success so they don't adapt.
  if (data.website || Number(data.elapsed) < LIMITS.minElapsed) return json({ ok: true }, 200, cors);

  if (!validSlug(slug)) return json({ error: "bad slug" }, 400, cors);
  if (!body) return json({ error: "The comment is empty." }, 400, cors);
  if (body.length > LIMITS.body) return json({ error: `Please keep it under ${LIMITS.body} characters.` }, 400, cors);
  if ((body.match(/https?:\/\//g) ?? []).length > LIMITS.links)
    return json({ error: `At most ${LIMITS.links} links per comment.` }, 400, cors);

  const now = Date.now();
  const ip = await hash(`${req.headers.get("CF-Connecting-IP") ?? "local"}|${env.IP_SALT ?? "dev"}`);
  const counts = await env.DB.prepare(
    "SELECT SUM(created_at > ?) AS recent, COUNT(*) AS day FROM comments WHERE ip_hash = ? AND created_at > ?"
  ).bind(now - 10 * MINUTE, ip, now - 1440 * MINUTE).first();
  if ((counts?.recent ?? 0) >= LIMITS.perTenMin || (counts?.day ?? 0) >= LIMITS.perDay)
    return json({ error: "Too many comments for now. Please try again later." }, 429, cors);

  if (!(await postExists(env, slug))) return json({ error: "Unknown post." }, 400, cors);

  const row = await env.DB.prepare(
    "INSERT INTO comments (slug, name, body, ip_hash, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id, name, body, created_at"
  ).bind(slug, name, body, ip, now).first();
  return json({ ok: true, comment: row }, 201, cors);
}

async function remove(req, env, cors, id) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) return json({ error: "unauthorized" }, 401, cors);
  const r = await env.DB.prepare("UPDATE comments SET deleted = 1 WHERE id = ?").bind(id).run();
  return json({ ok: r.meta.changes > 0 }, 200, cors);
}

const validSlug = (s) => /^[a-z0-9][a-z0-9-]{0,99}$/.test(s);

async function postExists(env, slug) {
  if (env.SKIP_SLUG_CHECK) return true;
  const r = await fetch(`${env.SITE}/blog/${slug}/`, { method: "HEAD", cf: { cacheTtl: 3600 } });
  return r.ok;
}

async function hash(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function corsHeaders(req, env) {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").includes(origin);
  return {
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
