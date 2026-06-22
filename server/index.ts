import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import * as cookie from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import type { Prijava, PrijavaStatus, PrijavaType } from "../shared/types";

const isProd = process.env.NODE_ENV === "production";

// Resolve persistent dirs from the working directory (project root), so the
// same paths work in `tsx` dev and the bundled prod build.
const ROOT = process.cwd();
const UPLOADS_DIR = path.join(ROOT, "uploads");
const DATA_DIR = path.join(ROOT, "data");
const PRIJAVE_FILE = path.join(DATA_DIR, "prijave.json");
const METRICS_FILE = path.join(DATA_DIR, "metrics.json");
const METRICS_RETENTION_DAYS = 14;

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// ─── Config ──────────────────────────────────────────────────────────────────
const ADMIN_USER = process.env.ADMIN_USER ?? "";
const ADMIN_PASS = process.env.ADMIN_PASS ?? "";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "";

if (!ADMIN_USER || !ADMIN_PASS || !SESSION_SECRET) {
  console.warn(
    "[auth] ADMIN_USER / ADMIN_PASS / SESSION_SECRET not fully set - admin login is disabled until you configure .env",
  );
}

const secretKey = new TextEncoder().encode(SESSION_SECRET || "insecure-dev-secret");

// ─── Gallery helpers ─────────────────────────────────────────────────────────
type GalleryItem = { name: string; src: string; alt: string };

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

// List every image in uploads/, newest first. The folder is the source of truth -
// no manifest to keep in sync.
async function listGallery(): Promise<GalleryItem[]> {
  let names: string[];
  try {
    names = await fs.readdir(UPLOADS_DIR);
  } catch {
    return [];
  }

  const images = names.filter(n => IMAGE_EXTS.has(path.extname(n).toLowerCase()));

  const withTime = await Promise.all(
    images.map(async name => {
      const { mtimeMs } = await fs.stat(path.join(UPLOADS_DIR, name));
      return { name, mtimeMs };
    }),
  );

  return withTime
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map(({ name }) => ({ name, src: `/uploads/${name}`, alt: "Dan Zauvek" }));
}

// ─── Prijave (volunteer/contact submissions) store ───────────────────────────
// Single JSON file, atomic writes serialized through a promise chain. Plenty for
// the low volume this festival form sees — no DB needed.

async function readPrijave(): Promise<Prijava[]> {
  try {
    const raw = await fs.readFile(PRIJAVE_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Serialize every read-modify-write through one chain so concurrent requests
// can't clobber each other (two submissions reading the same list and the
// second write dropping the first). The mutator gets the current list and
// returns the list to persist (or null to skip the write) plus a result for the
// caller. The chain is reset after each op regardless of outcome, so one failed
// write never poisons later ones.
let writeChain: Promise<unknown> = Promise.resolve();
function mutatePrijave<T>(
  mutator: (list: Prijava[]) => { write: Prijava[] | null; result: T },
): Promise<T> {
  const run = writeChain.then(async () => {
    const list = await readPrijave();
    const { write, result } = mutator(list);
    if (write) {
      const tmp = `${PRIJAVE_FILE}.${nanoid()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(write, null, 2));
      await fs.rename(tmp, PRIJAVE_FILE); // atomic on the same filesystem
    }
    return result;
  });
  writeChain = run.then(() => {}, () => {}); // keep the chain alive on error
  return run;
}

const VALID_TYPES = new Set<PrijavaType>(["volonter", "medij", "sponzor", "ostalo"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory per-IP rate limit: max submissions per rolling window.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const submitHits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submitHits.get(ip) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  submitHits.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

// ─── Visitor metrics ─────────────────────────────────────────────────────────
// Aggregated in memory into per-day buckets, flushed to disk periodically. Only
// the last METRICS_RETENTION_DAYS days are kept. IPs are hashed (never stored raw).

type MetricsBucket = {
  views: number;
  visitors: string[]; // hashed visitor ids seen this day
  referrers: Record<string, number>;
  devices: { mobile: number; desktop: number };
};
type MetricsData = Record<string, MetricsBucket>;

let metrics: MetricsData = {};
let metricsDirty = false;

const BOT_RE =
  /bot|crawl|spider|slurp|bing|google|baidu|yandex|duckduck|facebookexternalhit|whatsapp|telegram|discord|preview|monitor|curl|wget|headless|lighthouse|pingdom|uptime|semrush|ahrefs|python-requests|axios|node-fetch/i;
const MOBILE_RE = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i;

function dateKey(ms = Date.now()): string {
  return new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function visitorHash(ip: string, ua: string, day: string): string {
  return createHash("sha256")
    .update(`${ip}|${ua}|${day}|${SESSION_SECRET || "metrics-salt"}`)
    .digest("hex")
    .slice(0, 16);
}

function refSource(ref: unknown, selfHost: string): string {
  if (typeof ref !== "string" || !ref) return "(direktno)";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (!host || host === selfHost) return "(direktno)";
    return host;
  } catch {
    return "(direktno)";
  }
}

function pruneMetrics() {
  const cutoff = dateKey(Date.now() - METRICS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  for (const day of Object.keys(metrics)) {
    if (day < cutoff) delete metrics[day];
  }
}

async function loadMetrics() {
  try {
    const raw = await fs.readFile(METRICS_FILE, "utf8");
    const data = JSON.parse(raw);
    metrics = data && typeof data === "object" ? data : {};
  } catch {
    metrics = {};
  }
  pruneMetrics();
}

async function flushMetrics() {
  if (!metricsDirty) return;
  metricsDirty = false;
  pruneMetrics();
  const tmp = `${METRICS_FILE}.${nanoid()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(metrics));
  await fs.rename(tmp, METRICS_FILE);
}

// ─── Auth helpers ────────────────────────────────────────────────────────────
async function createSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

async function isAuthed(req: express.Request): Promise<boolean> {
  const header = req.headers.cookie;
  if (!header) return false;
  const token = cookie.parse(header)[COOKIE_NAME];
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}

async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (await isAuthed(req)) return next();
  res.status(401).json({ error: "Niste prijavljeni." });
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Sit behind a reverse proxy in prod — trust it so req.ip reflects the client.
  app.set("trust proxy", true);

  app.use(express.json({ limit: "25mb" }));

  // Load aggregated metrics and flush to disk periodically (cheap, low volume).
  await loadMetrics();
  setInterval(() => {
    flushMetrics().catch(err => console.error("[metrics] flush failed", err));
  }, 15_000).unref();

  // Flush in-memory metrics on shutdown so a redeploy doesn't drop the most
  // recent bucket (Docker sends SIGTERM, then SIGKILL after the grace period).
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    flushMetrics()
      .catch(err => console.error("[metrics] shutdown flush failed", err))
      .finally(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  // Serve uploaded gallery images.
  app.use("/uploads", express.static(UPLOADS_DIR));

  // ─── Auth routes ───────────────────────────────────────────────────────────
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body ?? {};
    if (!ADMIN_USER || !ADMIN_PASS || !SESSION_SECRET) {
      return res.status(503).json({ error: "Admin login nije konfigurisan na serveru." });
    }
    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return res.status(401).json({ error: "Pogrešno korisničko ime ili lozinka." });
    }
    const token = await createSession();
    res.setHeader(
      "Set-Cookie",
      cookie.serialize(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: ONE_YEAR_MS / 1000,
      }),
    );
    res.json({ success: true });
  });

  app.post("/api/logout", (_req, res) => {
    res.setHeader(
      "Set-Cookie",
      cookie.serialize(COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 0,
      }),
    );
    res.json({ success: true });
  });

  app.get("/api/me", async (req, res) => {
    res.json({ authenticated: await isAuthed(req) });
  });

  // ─── Gallery routes ──────────────────────────────────────────────────────────
  // Public: list images (read straight from the uploads/ folder)
  app.get("/api/gallery", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(await listGallery());
  });

  // Protected: upload an image (base64) - just drops a file into uploads/
  app.post("/api/gallery", requireAuth, async (req, res) => {
    const { base64, mimeType } = req.body ?? {};
    if (typeof base64 !== "string" || !base64) {
      return res.status(400).json({ error: "Nedostaje slika." });
    }
    const ext = MIME_EXT[mimeType];
    if (!ext) {
      return res.status(400).json({ error: "Nepodržan format slike." });
    }

    const name = `${nanoid()}.${ext}`;
    const buffer = Buffer.from(base64, "base64");
    await fs.writeFile(path.join(UPLOADS_DIR, name), buffer);

    const item: GalleryItem = { name, src: `/uploads/${name}`, alt: "Dan Zauvek" };
    res.json(item);
  });

  // Protected: delete an image - just removes the file from uploads/
  app.delete("/api/gallery/:name", requireAuth, async (req, res) => {
    const { name } = req.params;
    // Guard against path traversal.
    if (name.includes("/") || name.includes("\\") || name.includes("..")) {
      return res.status(400).json({ error: "Nevažeće ime fajla." });
    }
    const filePath = path.join(UPLOADS_DIR, name);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "Slika nije pronađena." });
    }
    await fs.rm(filePath, { force: true });
    res.json({ success: true });
  });

  // ─── Prijave routes ──────────────────────────────────────────────────────────
  // Public: submit a prijava (volunteer / press / sponsor / other).
  app.post("/api/prijave", async (req, res) => {
    const { name, email, type, message, website, elapsedMs } = req.body ?? {};

    // Honeypot — real users never see/fill `website`. Bots do; fake success.
    if (typeof website === "string" && website.trim() !== "") {
      return res.json({ success: true });
    }
    // Time-trap — a human can't fill this out in under ~2.5s.
    if (typeof elapsedMs === "number" && elapsedMs >= 0 && elapsedMs < 2500) {
      return res.json({ success: true });
    }

    const ip = req.ip || "unknown";
    if (rateLimited(ip)) {
      return res.status(429).json({ error: "Previše prijava. Pokušaj ponovo kasnije." });
    }

    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim() : "";
    const cleanMessage = typeof message === "string" ? message.trim() : "";
    const cleanType: PrijavaType = VALID_TYPES.has(type) ? type : "ostalo";

    if (!cleanName || cleanName.length > 120) {
      return res.status(400).json({ error: "Unesi ispravno ime." });
    }
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 200) {
      return res.status(400).json({ error: "Unesi ispravan email." });
    }
    if (cleanMessage.length > 2000) {
      return res.status(400).json({ error: "Poruka je predugačka." });
    }

    const now = Date.now();
    const entry: Prijava = {
      id: nanoid(),
      name: cleanName,
      email: cleanEmail,
      type: cleanType,
      message: cleanMessage,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    try {
      await mutatePrijave(list => {
        list.push(entry);
        return { write: list, result: null };
      });
    } catch (err) {
      console.error("[prijave] write failed", err);
      return res.status(500).json({ error: "Greška pri čuvanju prijave. Pokušaj ponovo." });
    }
    res.json({ success: true });
  });

  // Protected: list all prijave, newest first.
  app.get("/api/prijave", requireAuth, async (_req, res) => {
    res.set("Cache-Control", "no-store");
    const list = await readPrijave();
    list.sort((a, b) => b.createdAt - a.createdAt);
    res.json(list);
  });

  // Protected: update a prijava's status (accept / reject + reason / reopen).
  app.patch("/api/prijave/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body ?? {};
    const valid: PrijavaStatus[] = ["pending", "accepted", "rejected"];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: "Nevažeći status." });
    }
    const updated = await mutatePrijave(list => {
      const item = list.find(p => p.id === id);
      if (!item) return { write: null, result: null };
      item.status = status;
      item.reason =
        status === "rejected" && typeof reason === "string" ? reason.trim().slice(0, 500) : undefined;
      item.updatedAt = Date.now();
      return { write: list, result: item };
    });
    if (!updated) return res.status(404).json({ error: "Prijava nije pronađena." });
    res.json(updated);
  });

  // Protected: delete a prijava.
  app.delete("/api/prijave/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const deleted = await mutatePrijave(list => {
      const next = list.filter(p => p.id !== id);
      if (next.length === list.length) return { write: null, result: false };
      return { write: next, result: true };
    });
    if (!deleted) return res.status(404).json({ error: "Prijava nije pronađena." });
    res.json({ success: true });
  });

  // ─── Metrics routes ──────────────────────────────────────────────────────────
  // Public: a lightweight beacon the client fires once per page load.
  app.post("/api/track", (req, res) => {
    const ua = (req.headers["user-agent"] as string) || "";
    if (BOT_RE.test(ua)) return res.json({ ok: true }); // skip obvious bots

    const day = dateKey();
    const bucket = (metrics[day] ??= {
      views: 0,
      visitors: [],
      referrers: {},
      devices: { mobile: 0, desktop: 0 },
    });

    bucket.views++;

    const id = visitorHash(req.ip || "unknown", ua, day);
    if (!bucket.visitors.includes(id)) bucket.visitors.push(id);

    const selfHost = ((req.headers.host as string) || "").replace(/^www\./, "");
    const source = refSource(req.body?.referrer, selfHost);
    bucket.referrers[source] = (bucket.referrers[source] || 0) + 1;

    if (MOBILE_RE.test(ua)) bucket.devices.mobile++;
    else bucket.devices.desktop++;

    metricsDirty = true;
    res.json({ ok: true });
  });

  // Protected: aggregated metrics for the mgmt dashboard.
  app.get("/api/metrics", requireAuth, (_req, res) => {
    pruneMetrics();
    const days = Object.keys(metrics).sort();

    const dayList = days.map(d => ({
      date: d,
      views: metrics[d].views,
      visitors: metrics[d].visitors.length,
    }));
    const totalViews = dayList.reduce((sum, d) => sum + d.views, 0);

    const union = new Set<string>();
    const refTotals: Record<string, number> = {};
    const devices = { mobile: 0, desktop: 0 };
    for (const d of days) {
      const b = metrics[d];
      for (const v of b.visitors) union.add(v);
      for (const [k, n] of Object.entries(b.referrers)) refTotals[k] = (refTotals[k] || 0) + n;
      devices.mobile += b.devices.mobile;
      devices.desktop += b.devices.desktop;
    }

    const referrers = Object.entries(refTotals)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.set("Cache-Control", "no-store");
    res.json({
      totalViews,
      uniqueVisitors: union.size,
      days: dayList,
      referrers,
      devices,
      retentionDays: METRICS_RETENTION_DAYS,
    });
  });

  // ─── Static client (production only; in dev Vite serves the client) ──────────
  if (isProd) {
    const staticPath = path.resolve(import.meta.dirname, "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
