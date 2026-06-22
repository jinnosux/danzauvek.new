import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, AlertCircle, X, LogIn, LogOut } from "lucide-react";

const ORANGE = "oklch(0.72 0.18 55)";

type GalleryItem = { name: string; src: string; alt: string };

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const loadGallery = async () => {
    const res = await fetch("/api/gallery", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then(d => setAuthed(Boolean(d.authenticated)))
      .catch(() => setAuthed(false));
    loadGallery();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoggingIn(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Prijava nije uspela.");
      }
      setAuthed(true);
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prijava nije uspela.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setAuthed(false);
  };

  const handleFiles = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setError(null);
    setUploading(true);
    for (const file of Array.from(selectedFiles)) {
      try {
        const base64 = await fileToBase64(file);
        const res = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mimeType: file.type, alt: file.name }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Greška pri uploadu.");
        }
        const item: GalleryItem = await res.json();
        setItems(prev => [item, ...prev]);
      } catch (e) {
        setError(`Greška pri uploadu: ${file.name}`);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (name: string) => {
    if (!confirm("Obrisati ovu fotografiju?")) return;
    setError(null);
    const res = await fetch(`/api/gallery/${encodeURIComponent(name)}`, { method: "DELETE" });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.name !== name));
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Brisanje nije uspelo.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D0D0D" }}>
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0D0D0D" }}>
        <form onSubmit={handleLogin} className="w-full max-w-sm text-center">
          <div className="text-6xl mb-6">🎸</div>
          <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Dan Zauvek Admin
          </h1>
          <p className="text-white/50 mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            Prijavi se da bi upravljao galerijom.
          </p>
          <input
            type="text"
            placeholder="Korisničko ime"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full mb-3 px-4 py-3 rounded-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-orange-400"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
          <input
            type="password"
            placeholder="Lozinka"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full mb-4 px-4 py-3 rounded-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-orange-400"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
          {error && <p className="text-red-400 text-sm mb-4" style={{ fontFamily: "Inter, sans-serif" }}>{error}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm uppercase tracking-widest rounded-sm disabled:opacity-50"
            style={{ background: ORANGE, color: "#0D0D0D", fontFamily: "Montserrat, sans-serif" }}
          >
            <LogIn size={16} />
            {loggingIn ? "Prijavljujem..." : "Prijavi se"}
          </button>
          <a href="/" className="mt-6 inline-block text-white/40 hover:text-white text-sm transition-colors">
            ← Nazad na sajt
          </a>
        </form>
      </div>
    );
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      <div style={{ background: "oklch(0.14 0 0)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/">
              <img src="/brand/logo.webp" alt="Dan Zauvek" className="h-7 w-auto" />
            </a>
            <span className="text-white/20">/</span>
            <span className="text-sm font-semibold text-orange-400" style={{ fontFamily: "Inter, sans-serif" }}>
              Galerija
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-xs text-white/40 hover:text-white transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
              ← Sajt
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <LogOut size={13} /> Odjavi se
            </button>
          </div>
        </div>
      </div>

      <div className="container py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Galerija
          </h1>
          <p className="text-white/50" style={{ fontFamily: "Inter, sans-serif" }}>
            Dodaj nove ili obriši postojeće fotografije. Promene su odmah vidljive na sajtu.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className="rounded-sm border-2 border-dashed p-12 text-center cursor-pointer transition-all mb-8"
          style={{ borderColor: "rgba(255,107,26,0.3)", background: "rgba(255,107,26,0.04)" }}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/60 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Uploadujem...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload size={40} className="text-orange-400/60" />
              <div>
                <p className="text-white font-semibold mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Prevuci fotografije ovde
                </p>
                <p className="text-white/40 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                  ili klikni da odabereš fajlove · PNG, JPG, WEBP
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-sm mb-6" style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.2)" }}>
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Gallery grid */}
        <h2 className="text-lg font-black text-white mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Fotografije ({items.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map(item => (
            <div key={item.name} className="group relative aspect-square rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <img src={item.src} alt={item.alt} className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(item.name)}
                className="absolute top-2 right-2 p-2 rounded-sm bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                title="Obriši"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-white/30 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            Još nema fotografija. Dodaj prvu iznad.
          </p>
        )}
      </div>
    </div>
  );
}
