# blog-comments

Anonymous comments for the blog: a Cloudflare Worker + D1 (free tier). No accounts; comments publish instantly.
Spam guards: hidden honeypot field, a minimum time on page, at most 2 links, and per-IP rate limits (5 per 10 min, 30 per day, stored as a salted hash).

## Deploy (once)

```bash
cd workers/comments
npx wrangler login
npx wrangler d1 create blog-comments        # paste database_id into wrangler.toml
npx wrangler d1 execute blog-comments --remote --file=schema.sql
openssl rand -hex 32 | npx wrangler secret put ADMIN_TOKEN
openssl rand -hex 32 | npx wrangler secret put IP_SALT
npx wrangler deploy                         # prints https://blog-comments.anshulheaven.workers.dev
```

Then set `commentsApi` in `src/data/site.js` to that URL.

## Local

```bash
npx wrangler d1 execute blog-comments --local --file=schema.sql
npx wrangler dev --port 8787                # .dev.vars: SKIP_SLUG_CHECK=1, ADMIN_TOKEN=dev-admin
PUBLIC_COMMENTS_API=http://localhost:8787 npm run dev   # from the repo root
```

## Moderate

```bash
# list a post's comments (ids)
curl -s "https://blog-comments.anshulheaven.workers.dev/comments?slug=lab-standard"
# delete one (soft delete)
curl -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" https://blog-comments.anshulheaven.workers.dev/comments/42
```
