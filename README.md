# Talk to Strangers India — Free Indian Anonymous Stranger Chat

Production-ready, mobile-first, 100% free-tier compatible anonymous 1-on-1 text chat platform (Omegle/FunChat alternative for India).

**Stack:** Next.js 14 (App Router) + Tailwind CSS + Socket.io-client | Node.js + Express + Socket.io (standalone WebSocket server)

---

## Features

- **🎮 Multiplayer In-Chat Games** — Challenge your stranger to real-time mini-games without leaving the conversation:
  - **Zero Kaata (Tic-Tac-Toe)**: Interactive 3x3 turn-based duel with live sync, win/draw detection, and score tracking.
  - **Stone-Paper-Scissors**: Classic childhood duel with dramatic simultaneous reveals and round counter.
  - **Desi Quiz Duel**: 5 timed rounds of Bollywood, Cricket, Indian food, and pop-culture trivia with speed bonuses.
  - **Collapsible Game Hub**: Minimize any active game into a floating pill to keep chatting and playing simultaneously!
- **💡 "Break The Ice" Desi Prompts** — 1-click generator for hilarious Indian debates (e.g. *Maggi with ketchup*, *Biryani wars*, *Goa vs Himachal*), dilemmas, and conversation starters.
- **🎯 Interest / Topic Matching** — Pick chips (🏏 Cricket, 🎬 Bollywood, 🎮 Gaming, 💻 Tech, ☕ Late Night Talks) or add custom topics to match with like-minded strangers.
- **🔊 Web Audio Synthesizer** — Zero-asset, zero-latency native audio sound effects (sent/received pings, victory fanfares, match sounds) with mute toggle.
- **⚡ Quick Reaction Bar** — Instant expressive emojis (❤️, 😂, 🔥, 👏, 🇮🇳, 🤝) and popular Hindi slang responses.
- **Real-time matchmaking** — In-memory queue with interest overlap priority and fast FIFO fallback.
- **Mobile-first dark UI** — Auto-scrolling chat, typing indicator, keyboard shortcuts (Enter=send, Esc=skip, Alt+G=games, Alt+I=icebreaker).
- **Safety & Indian compliance** — 18+ age gate, phone/social handle blocking, profanity filter, rate limiting, report/block (24h IP-hash blocklist).
- **Legal pages** — Terms, Privacy, Disclaimer with Grievance Officer (IT Act 2000 / IT Rules 2021).
- **SEO-ready** — JSON-LD FAQPage & WebApplication schema, OpenGraph, sitemap.xml, robots.txt.
- **Free-tier deployment** — Render (WebSocket backend) + Vercel (Next.js frontend).

---

## Project Structure

```
.
├── server/                 # WebSocket backend (Node + Express + Socket.io)
│   ├── index.js            # Main server: matchmaking, chat, moderation
│   ├── moderation.js       # Safety filters (phone, social, profanity, rate-limit)
│   ├── package.json
│   ├── Dockerfile
│   ├── .env.example
│   └── .dockerignore
├── web/                    # Next.js frontend
│   ├── app/
│   │   ├── layout.js       # Root layout + SEO metadata + JSON-LD schemas
│   │   ├── page.jsx        # Client entry (loads Chat)
│   │   ├── globals.css     # Tailwind + custom dark theme
│   │   ├── components/Chat.jsx  # Full chat UI (states, sockets, modals)
│   │   ├── components/games/    # Multiplayer in-chat games
│   │   ├── data/           # Icebreakers & trivia questions
│   │   ├── terms/page.jsx
│   │   ├── privacy/page.jsx
│   │   ├── disclaimer/page.jsx
│   │   ├── sitemap.js
│   │   └── robots.js
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── jsconfig.json
│   ├── vercel.json
│   ├── .env.example
│   └── .gitignore
├── render.yaml             # Render blueprint for backend
└── README.md
```

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env if needed (CLIENT_URLS for local frontend)
npm install
npm run dev
# Server runs on http://localhost:3001
```

### 2. Frontend

```bash
cd web
cp .env.example .env.local
# Ensure NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

Open http://localhost:3000 → Accept age gate → Start chatting.

---

## Deployment (Free Tier)

### Backend → Render (Free Web Service)

1. Push this repo to GitHub.
2. In Render Dashboard → **New +** → **Web Service** → Connect repo.
3. Settings:
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free
   - **Health Check Path**: `/health`
4. Environment Variables (Render → Environment):
   - `CLIENT_URLS` = `https://your-frontend.vercel.app` (comma-separated if multiple)
   - `IP_SALT` = *auto-generated* (or set a random string)
   - `NODE_ENV` = `production`
5. Deploy. Note the service URL, e.g. `https://talktostrangers-server.onrender.com`.

### Frontend → Vercel (Free Hobby)

1. In Vercel Dashboard → **Add New Project** → Import same repo.
2. **Root Directory**: `web`
3. Framework: Next.js (auto-detected)
4. Environment Variables:
   - `NEXT_PUBLIC_APP_NAME` = `Talk to Strangers India`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://talktostrangers-server.onrender.com` (your Render URL)
   - `NEXT_PUBLIC_APP_URL` = `https://your-frontend.vercel.app`
5. Deploy.

### Post-Deploy

- Update Render `CLIENT_URLS` to include your Vercel URL.
- Test: open Vercel URL → age gate → "Start Chatting" → wait for match.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Port (default 3001) |
| `CLIENT_URLS` | Yes | Comma-separated allowed origins (local + Vercel) |
| `IP_SALT` | Yes | Random salt for IP hashing (privacy-safe blocklist) |

### Frontend (`web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_NAME` | No | Brand name (default: Talk to Strangers India) |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Backend WebSocket URL (e.g. `https://talktostrangers-server.onrender.com`) |
| `NEXT_PUBLIC_APP_URL` | No | Frontend canonical URL (for sitemap/OG) |

---

## Moderation Details

| Check | Implementation |
|-------|----------------|
| Indian mobile numbers | Regex `^[6-9]\d{9}$` (with separators, +91 prefix) |
| WhatsApp/Telegram/Instagram links | Domain + path patterns |
| `@username` handles | `@[a-zA-Z0-9_]{3,30}` |
| General URLs | `https?://` or `www.` |
| Profanity (EN + transliterated HI) | Word-boundary regex list |
| Rate limit | ≤2 msg/sec per socket |
| Repeat spam | ≤3 identical messages per session |
| Report blocklist | SHA-256(ip + salt), 24h TTL, in-memory Map |

All checks run **server-side** in `moderation.moderateMessage()` before relay. Client-side sanitization is defense-in-depth.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Esc` (once) | Skip/leave current chat |
| `Alt+G` | Open / toggle Multiplayer Games |
| `Alt+I` | Open / toggle Icebreaker Prompts |

---

## Health Check

`GET /health` returns:
```json
{
  "status": "ok",
  "uptime": 123.45,
  "online": 42,
  "waiting": 3,
  "rooms": 12
}
```
Render uses this to keep the free service awake.

---

## License

MIT — Free to use, modify, deploy. Attribution appreciated.

---

## Support / Grievance

Email: `grievance@talktostrangersindia.com`

For Indian IT Act compliance, this address must be monitored and respond within 24h (acknowledgment) / 15 days (resolution).