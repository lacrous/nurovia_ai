# Deploying Nurovia AI

Nurovia AI is **host-agnostic**. Pick any of these — they all work.

| host | best for | cost | time to deploy |
|---|---|---|---|
| [Vercel](#vercel) | zero-config | free tier | 5 min |
| [Railway](#railway) | simplest paid | $5/mo flat | 3 min |
| [Fly.io](#flyio) | edge / global | free tier | 5 min |
| [Render](#render) | managed everything | free tier | 5 min |
| [Docker on VPS](#docker-on-a-vps) | full control | $5/mo | 20 min |

**TL;DR — pick whatever you already have an account on.**

---

## Prereqs (all hosts)

- GitHub account
- Node.js 20+ locally (only needed for dev/testing — not for deploy)
- Optional: a domain you control

---

## Vercel

### Step 1 — push to GitHub

```bash
cd nurovia
git init && git add . && git commit -m "feat: initial monorepo"
# create empty repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/nurovia-ai.git
git push -u origin main
```

### Step 2 — import in Vercel

1. https://vercel.com → **Add New Project** → Import your repo
2. Framework Preset: **Other**
3. Root Directory: `./`
4. click **Deploy** (it'll fail — DB not connected yet)

### Step 3 — add Postgres

project → **Storage** → **Create Database** → **Postgres** → tick Preview + Production → Create

this auto-sets `DATABASE_URL`.

### Step 4 — add env vars

**Settings → Environment Variables**:

| name | value |
|---|---|
| `ENCRYPTION_KEY` | `openssl rand -base64 32` |
| `FRONTEND_URL` | your Vercel URL (visible after first deploy) |
| `COOKIE_SECURE` | `true` |
| `ENVIRONMENT` | `production` |

### Step 5 — apply schema

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
cd api && npm run db:push
git push     # triggers redeploy
```

### Step 6 — done

open your Vercel URL → sign up → chat works.

---

## Railway

```bash
# one-time setup
npm install -g @railway/cli
railway login

# in your repo
railway init
railway add --plugin postgres
railway up

# add secrets
railway variables set ENCRYPTION_KEY=$(openssl rand -base64 32)
railway variables set FRONTEND_URL=https://your-app.up.railway.app
railway variables set COOKIE_SECURE=true
railway variables set ENVIRONMENT=production

# apply schema
railway run npm --prefix api run db:push
```

or use the dashboard: https://railway.app → New Project → Deploy from GitHub → add Postgres plugin → set env vars.

the `railway.toml` at repo root configures the build for you.

---

## Fly.io

```bash
# one-time
curl -L https://fly.io/install.sh | sh
fly auth signup

# in your repo
fly launch --no-deploy          # uses fly.toml
fly postgres create
fly postgres attach <db-name>   # sets DATABASE_URL
fly secrets set ENCRYPTION_KEY=$(openssl rand -base64 32)
fly secrets set FRONTEND_URL=https://nurovia-ai.fly.dev
fly secrets set COOKIE_SECURE=true

# apply schema
fly postgres connect -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" <db-name>
fly ssh console --command "cd /app && DATABASE_URL=\$DATABASE_URL node -e \"require('./api/dist/index.js')\""
# (or run db:push from a fly ssh session)

# deploy
fly deploy
```

or use the dashboard: https://fly.io/dashboard

---

## Render

1. go to https://dashboard.render.com/blueprints
2. connect your GitHub repo
3. Render reads `render.yaml` at root and auto-creates:
   - Postgres database (`nurovia-db`)
   - Web service (`nurovia-ai`) using the Dockerfile
4. wait for first deploy
5. apply schema:
   ```bash
   # get DATABASE_URL from Render dashboard
   cd api && DATABASE_URL=... npm run db:push
   ```
6. update `FRONTEND_URL` env var with your actual Render URL

---

## Docker on a VPS

(any provider — Hetzner, DigitalOcean, Vultr, AWS Lightsail, Oracle free tier)

```bash
# on your VPS
ssh root@your-vps-ip

# install docker
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin   # or just use docker compose

# clone the repo
git clone https://github.com/YOUR_USERNAME/nurovia-ai.git
cd nurovia-ai

# set env
cp .env.example .env
nano .env    # fill DATABASE_URL, ENCRYPTION_KEY, FRONTEND_URL

# bring up app + postgres
docker compose up -d

# apply schema
docker compose exec app sh -c "cd api && DATABASE_URL=\$DATABASE_URL npm run db:push"
```

### add a domain (optional)

```bash
# install nginx + certbot
apt install -y nginx certbot python3-certbot-nginx

# proxy port 80 → 3000
cat > /etc/nginx/sites-available/nurovia <<'EOF'
server {
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
ln -s /etc/nginx/sites-available/nurovia /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# free TLS
certbot --nginx -d your-domain.com
```

---

## Picking the right host

| if you want... | use |
|---|---|
| fastest time to live | **Vercel** |
| cheapest predictable cost | **Railway** ($5/mo all-in) |
| global edge performance | **Fly.io** |
| managed everything, no ops | **Render** |
| full control, learn DevOps | **VPS + Docker** |

all support the same env vars. switch hosts anytime — the codebase doesn't change.

---

## cost comparison

| tier | Vercel | Railway | Fly | Render | VPS |
|---|---|---|---|---|---|
| free | ✓ generous | ✗ ($5 trial) | ✓ limited | ✓ limited | n/a |
| 1k MAU | $0 | $5/mo | $0 | $0 | $5/mo |
| 10k MAU | $20/mo | $25/mo | $15/mo | $25/mo | $10/mo |
| 100k MAU | $200/mo | $100/mo | $80/mo | $100/mo | $50/mo |

---

## what this repo gives you

✅ one codebase
✅ five deployment options
✅ same env vars across all hosts
✅ swap hosts in 10 minutes — just re-deploy
✅ never lock in

---

## troubleshooting

### "Build failed" on Vercel

run `npm install` and `npm run build` locally — if it works there, it'll work on Vercel.

### "DATABASE_URL not set"

the host didn't auto-create a database. add a Postgres plugin/service manually.

### "ECONNREFUSED 127.0.0.1:5432"

DATABASE_URL is pointing to localhost. on managed hosts, the DB host is given by the platform — don't hardcode.

### "CORS error"

`FRONTEND_URL` doesn't match the actual URL the browser is using. update it + redeploy.

### "session cookie not set"

check `COOKIE_SECURE` is `true` AND the URL is HTTPS. on HTTP localhost, set it to `false`.

### "Docker build failed"

`docker build -t nurovia:latest .` locally — if it fails there, the Dockerfile is wrong. if it works locally but fails on host, check the host's Docker version (need 20+ for BuildKit).

---

## useful commands

```bash
# local dev
npm run dev                 # both frontend + backend, port 3001

# local prod test (Docker)
docker compose up --build   # full prod stack at :3000

# typecheck both
npm run typecheck

# test both
npm test

# deploy
vercel --prod               # Vercel
railway up                  # Railway
fly deploy                  # Fly.io
git push                    # Render (auto-deploys)

# apply DB schema
npm run db:push             # works against any DATABASE_URL
```