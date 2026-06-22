# Dan Zauvek — Festival Website

Static React (Vite) marketing site for the Dan Zauvek festival, plus a small Express
API that powers an admin photo gallery (upload / delete) with no database.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4, routing via `wouter`
- **Backend:** Express, session auth via a signed cookie (`jose`) using credentials
  from `.env` — no database
- **Gallery storage:** image files live in `uploads/` — the folder *is* the gallery
  (the API lists whatever images are in it; no manifest)

## Setup

```bash
npm install
cp .env.example .env      # then edit the values
```

`.env`:

```
ADMIN_USER=admin
ADMIN_PASS=change-me
SESSION_SECRET=<long random string — generate with: openssl rand -hex 32>
```

## Development

```bash
npm run dev       # runs Vite (client) + Express API together
```

- Site: http://localhost:5173
- Admin: http://localhost:5173/admin
- The Vite dev server proxies `/api` and `/uploads` to the Express server on port 3000.

(You can also run the two halves separately with `npm run dev:client` and `npm run dev:server`.)

## Production

```bash
npm run build     # builds client -> dist/public and server -> dist/index.js
npm start         # serves the built site + API on port 3000 (PORT to override)
```

In production the Express server serves the built site, the gallery API, and the
uploaded images. Keep the `uploads/` directory on persistent storage
so photos survive restarts/redeploys.

## Admin gallery

Go to `/admin`, log in with the `.env` credentials, then drag-and-drop images to add
them or hover a photo and click the trash icon to remove it. Changes appear on the
public site immediately (the gallery section reads `/api/gallery`).

### API

| Method | Path                 | Auth | Purpose               |
| ------ | -------------------- | ---- | --------------------- |
| POST   | `/api/login`         | —    | Log in, sets cookie   |
| POST   | `/api/logout`        | —    | Clear session         |
| GET    | `/api/me`            | —    | `{ authenticated }`   |
| GET    | `/api/gallery`       | —    | List gallery photos   |
| POST   | `/api/gallery`       | ✅   | Upload (base64 image) |
| DELETE | `/api/gallery/:name` | ✅   | Delete a photo        |

## Band photos

Band/lineup photos are **not** managed through the admin — they're set in code in
`client/src/pages/Home.tsx` (`DAY1_ACTS` / `DAY2_ACTS`, the `img` field) and live in
`client/public/bands/`. To change one, drop a file in that folder and point `img` at it.

> Three acts (**Basil**, **DJ Enes Daca**, **DJ Irhad**) currently use the hero image
> as a placeholder. Three unmatched photos exist in `client/public/bands/`
> (`adem_amar_mina.webp`, `dj_ico.webp`, `dj_seminem.webp`) — wire them up once the
> correct band↔photo mapping is confirmed.
