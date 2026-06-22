import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, AlertCircle, X, LogIn, LogOut, Check, Ban, RotateCcw, Mail, Inbox, Images, Eye, Users, Smartphone, Monitor, BarChart3 } from "lucide-react";
import type { Prijava, PrijavaStatus, MetricsResponse } from "@shared/types";

const ORANGE = "oklch(0.72 0.18 55)";

type GalleryItem = { name: string; src: string; alt: string };
type Tab = "prijave" | "metrika" | "galerija";

const TYPE_LABELS: Record<string, string> = {
  volonter: "Volonter",
  medij: "Medij / Press",
  sponzor: "Sponzor / Partner",
  ostalo: "Ostalo",
};

const STATUS_META: Record<PrijavaStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Na čekanju", color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  accepted: { label: "Prihvaćeno", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  rejected: { label: "Odbijeno", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("prijave");
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Gallery state
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prijave state
  const [prijave, setPrijave] = useState<Prijava[]>([]);
  const [filter, setFilter] = useState<"all" | PrijavaStatus>("all");

  // Metrics state
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);

  const loadGallery = async () => {
    const res = await fetch("/api/gallery", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
  };

  const loadPrijave = async () => {
    const res = await fetch("/api/prijave", { cache: "no-store" });
    if (res.ok) setPrijave(await res.json());
  };

  const loadMetrics = async () => {
    const res = await fetch("/api/metrics", { cache: "no-store" });
    if (res.ok) setMetrics(await res.json());
  };

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then(d => setAuthed(Boolean(d.authenticated)))
      .catch(() => setAuthed(false));
    loadGallery();
  }, []);

  // Prijave + metrics are protected — only fetch once we know we're logged in.
  useEffect(() => {
    if (authed) {
      loadPrijave();
      loadMetrics();
    }
  }, [authed]);

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

  // ─── Prijave actions ─────────────────────────────────────────────────────────
  const setStatus = async (id: string, status: PrijavaStatus, reason?: string) => {
    setError(null);
    const res = await fetch(`/api/prijave/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    if (res.ok) {
      const updated: Prijava = await res.json();
      setPrijave(prev => prev.map(p => (p.id === id ? updated : p)));
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Greška pri izmeni.");
    }
  };

  const acceptPrijava = (id: string) => setStatus(id, "accepted");
  const reopenPrijava = (id: string) => setStatus(id, "pending");
  const rejectPrijava = (id: string) => {
    const reason = prompt("Razlog odbijanja (opciono):");
    if (reason === null) return; // cancelled
    setStatus(id, "rejected", reason);
  };

  const deletePrijava = async (id: string) => {
    if (!confirm("Trajno obrisati ovu prijavu?")) return;
    setError(null);
    const res = await fetch(`/api/prijave/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPrijave(prev => prev.filter(p => p.id !== id));
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Brisanje nije uspelo.");
    }
  };

  const pendingCount = prijave.filter(p => p.status === "pending").length;
  const visiblePrijave = filter === "all" ? prijave : prijave.filter(p => p.status === filter);

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
            Prijavi se da bi upravljao sajtom.
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
  const tabBtn = (id: Tab, label: string, count?: number) => (
    <button
      onClick={() => setTab(id)}
      className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
      style={{ fontFamily: "Inter, sans-serif", color: tab === id ? ORANGE : "rgba(255,255,255,0.4)" }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
          style={{ background: ORANGE, color: "#0D0D0D" }}
        >
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      <div style={{ background: "oklch(0.14 0 0)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/">
              <img src="/brand/logo.webp" alt="Dan Zauvek" className="h-7 w-auto" />
            </a>
            <span className="text-white/20">/</span>
            {tabBtn("prijave", "Prijave", pendingCount)}
            {tabBtn("metrika", "Metrika")}
            {tabBtn("galerija", "Galerija")}
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

        {/* ─── Prijave tab ──────────────────────────────────────────────────── */}
        {tab === "prijave" && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Prijave
              </h1>
              <p className="text-white/50" style={{ fontFamily: "Inter, sans-serif" }}>
                Volonteri, mediji i sponzori koji su se prijavili preko sajta.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {([
                ["all", `Sve (${prijave.length})`],
                ["pending", `Na čekanju (${prijave.filter(p => p.status === "pending").length})`],
                ["accepted", `Prihvaćeni (${prijave.filter(p => p.status === "accepted").length})`],
                ["rejected", `Odbijeni (${prijave.filter(p => p.status === "rejected").length})`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className="px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    background: filter === key ? ORANGE : "rgba(255,255,255,0.05)",
                    color: filter === key ? "#0D0D0D" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-3">
              {visiblePrijave.map(p => {
                const meta = STATUS_META[p.status];
                return (
                  <div
                    key={p.id}
                    className="rounded-sm p-4"
                    style={{ background: "oklch(0.14 0 0)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            {p.name}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-sm text-[11px] font-semibold"
                            style={{ background: meta.bg, color: meta.color, fontFamily: "Inter, sans-serif" }}
                          >
                            {meta.label}
                          </span>
                          <span className="text-xs text-white/40" style={{ fontFamily: "Inter, sans-serif" }}>
                            {TYPE_LABELS[p.type] ?? p.type}
                          </span>
                        </div>
                        <a
                          href={`mailto:${p.email}`}
                          className="inline-flex items-center gap-1 text-xs text-orange-400 hover:underline mt-1"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          <Mail size={11} /> {p.email}
                        </a>
                      </div>
                      <span className="text-xs text-white/30 whitespace-nowrap" style={{ fontFamily: "Inter, sans-serif" }}>
                        {new Date(p.createdAt).toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                    </div>

                    {p.message && (
                      <p className="text-sm text-white/60 mt-3 whitespace-pre-line" style={{ fontFamily: "Inter, sans-serif" }}>
                        {p.message}
                      </p>
                    )}

                    {p.status === "rejected" && p.reason && (
                      <p className="text-xs mt-2" style={{ color: "#ef4444", fontFamily: "Inter, sans-serif" }}>
                        Razlog: {p.reason}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      {p.status !== "accepted" && (
                        <button
                          onClick={() => acceptPrijava(p.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors"
                          style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", fontFamily: "Inter, sans-serif" }}
                        >
                          <Check size={13} /> Prihvati
                        </button>
                      )}
                      {p.status !== "rejected" && (
                        <button
                          onClick={() => rejectPrijava(p.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", fontFamily: "Inter, sans-serif" }}
                        >
                          <Ban size={13} /> Odbij
                        </button>
                      )}
                      {p.status !== "pending" && (
                        <button
                          onClick={() => reopenPrijava(p.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold text-white/50 hover:text-white transition-colors"
                          style={{ background: "rgba(255,255,255,0.05)", fontFamily: "Inter, sans-serif" }}
                        >
                          <RotateCcw size={13} /> Vrati na čekanje
                        </button>
                      )}
                      <button
                        onClick={() => deletePrijava(p.id)}
                        className="ml-auto p-1.5 rounded-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Obriši"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {visiblePrijave.length === 0 && (
              <div className="flex flex-col items-center text-center py-16 text-white/30">
                <Inbox size={36} className="mb-3" />
                <p className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                  Nema prijava{filter !== "all" ? " u ovoj kategoriji" : " još uvek"}.
                </p>
              </div>
            )}
          </>
        )}

        {/* ─── Metrika tab ──────────────────────────────────────────────────── */}
        {tab === "metrika" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Metrika
              </h1>
              <p className="text-white/50" style={{ fontFamily: "Inter, sans-serif" }}>
                Posete sajtu — poslednjih {metrics?.retentionDays ?? 14} dana. Bez kolačića; IP adrese se ne čuvaju.
              </p>
            </div>

            {!metrics || metrics.days.length === 0 ? (
              <div className="flex flex-col items-center text-center py-16 text-white/30">
                <BarChart3 size={36} className="mb-3" />
                <p className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                  Još nema podataka o posetama.
                </p>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {[
                    { label: "Pregledi", value: metrics.totalViews, icon: <Eye size={15} /> },
                    { label: "Posetioci", value: metrics.uniqueVisitors, icon: <Users size={15} /> },
                    { label: "Mobilni", value: metrics.devices.mobile, icon: <Smartphone size={15} /> },
                    { label: "Desktop", value: metrics.devices.desktop, icon: <Monitor size={15} /> },
                  ].map(c => (
                    <div key={c.label} className="rounded-sm p-4" style={{ background: "oklch(0.14 0 0)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center gap-1.5 text-white/40" style={{ color: ORANGE }}>
                        {c.icon}
                        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
                          {c.label}
                        </span>
                      </div>
                      <div className="text-3xl font-black text-white mt-2 tabular-nums" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {c.value.toLocaleString("sr-RS")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Daily views chart */}
                <div className="rounded-sm p-5 mb-8" style={{ background: "oklch(0.14 0 0)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <h2 className="text-sm font-black text-white uppercase tracking-wide" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Pregledi po danu
                  </h2>
                  {(() => {
                    const maxViews = Math.max(...metrics.days.map(d => d.views), 1);
                    return (
                      <>
                        <div className="flex items-end gap-1 h-40 mt-5">
                          {metrics.days.map(d => (
                            <div
                              key={d.date}
                              className="flex-1 min-w-0 flex flex-col justify-end h-full"
                              title={`${d.date} · ${d.views} pregleda · ${d.visitors} posetilaca`}
                            >
                              <div
                                className="w-full rounded-t-sm"
                                style={{
                                  height: `${d.views > 0 ? Math.max((d.views / maxViews) * 100, 3) : 0}%`,
                                  background: ORANGE,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-white/30 tabular-nums" style={{ fontFamily: "Inter, sans-serif" }}>
                          <span>{metrics.days[0].date}</span>
                          <span>{metrics.days[metrics.days.length - 1].date}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Top referrers */}
                <div className="rounded-sm p-5" style={{ background: "oklch(0.14 0 0)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <h2 className="text-sm font-black text-white uppercase tracking-wide mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Izvori poseta
                  </h2>
                  {metrics.referrers.length === 0 ? (
                    <p className="text-white/30 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Nema podataka.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {metrics.referrers.map(r => (
                        <div key={r.source} className="flex items-center justify-between gap-3 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                          <span className="text-white/70 truncate">{r.source}</span>
                          <span className="text-white/40 tabular-nums">{r.count.toLocaleString("sr-RS")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ─── Galerija tab ─────────────────────────────────────────────────── */}
        {tab === "galerija" && (
          <>
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

            {/* Gallery grid */}
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
              <Images size={18} /> Fotografije ({items.length})
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
          </>
        )}
      </div>
    </div>
  );
}
