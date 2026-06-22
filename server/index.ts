import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import * as cookie from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";

const isProd = process.env.NODE_ENV === "production";

// Resolve persistent dirs from the working directory (project root), so the
// same paths work in `tsx` dev and the bundled prod build.
const ROOT = process.cwd();
const UPLOADS_DIR = path.join(ROOT, "uploads");

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

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

  app.use(express.json({ limit: "25mb" }));

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
