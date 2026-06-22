import { useEffect, useState } from "react";
import { Menu, X, MapPin, Calendar, Music, Users, Ticket, Instagram, Facebook, Globe, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import lineup from "@/data/lineup.json";

// ─── DATA ───────────────────────────────────────────────────────────────────

// Fallback when a band has no photo yet (set `img: ""` for that act in lineup.json).
const PLACEHOLDER_IMG = "/brand/hero.jpg";

// Band/act data lives in client/src/data/lineup.json — edit it there.
const DAY1_ACTS = lineup.day1;
const DAY2_ACTS = lineup.day2;

const ARCHIVE_YEARS = [
  { year: 2025, location: "Bašta Troja, Novi Pazar", edition: "12. festival", highlight: "Rekordna posećenost — preko 800 posetilaca tokom dva dana" },
  { year: 2024, location: "Bašta Troja, Novi Pazar", edition: "11. festival", highlight: "Drugi put u Novom Pazaru — festival pronašao novi dom" },
  { year: 2023, location: "Bašta Troja, Novi Pazar", edition: "10. festival", highlight: "Jubilarna deseta godina — specijalni program i gosti" },
  { year: 2022, location: "Novi Pazar", edition: "9. festival", highlight: "Povratak posle pauze — festival jači nego ikad" },
  { year: 2021, location: "Raška", edition: "8. festival", highlight: "Hibridni format — online i offline nastup" },
  { year: 2019, location: "Raška", edition: "7. festival", highlight: "Prošireni program — prvi put dva dana" },
  { year: 2018, location: "Raška", edition: "6. festival", highlight: "Regionalno proširenje — bendovi iz Kosovske Mitrovice" },
  { year: 2017, location: "Raška", edition: "5. festival", highlight: "Jubilarna peta godina — specijalni gosti" },
  { year: 2016, location: "Raška", edition: "4. festival", highlight: "Rast publike i medijsko prisustvo" },
  { year: 2015, location: "Raška", edition: "3. festival", highlight: "Uspostavljanje tradicije" },
  { year: 2014, location: "Raška", edition: "2. festival", highlight: "Drugi festival — potvrda koncepta" },
  { year: 2013, location: "Raška", edition: "1. festival", highlight: "Osnivanje festivala — memorijalni koncert" },
];

// ─── COUNTDOWN ──────────────────────────────────────────────────────────────

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

// ─── SCROLL ANIMATION HOOK ───────────────────────────────────────────────────

function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".fade-in-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── NAV ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Program", href: "#program" },
    { label: "Izvođači", href: "#izvodjaci" },
    { label: "O festivalu", href: "#o-festivalu" },
    { label: "Galerija", href: "#galerija" },
    // { label: "Arhiva", href: "#arhiva" },
    { label: "Kontakt", href: "#kontakt" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(13,13,13,0.97)" : "rgba(13,13,13,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="container flex items-center justify-between h-16">
        {/* Logo — final PNG logo */}
        <a href="#" className="flex items-center group">
          <img
            src="/brand/logo.webp"
            alt="Dan Zauvek"
            className="h-10 w-auto transition-opacity group-hover:opacity-80"
          />
        </a>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-white/55 hover:text-orange-400 transition-colors"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", letterSpacing: "0.18em", fontWeight: 700, textTransform: "uppercase" }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3">
          <a
            href="#program"
            className="px-5 py-2.5 rounded-sm font-bold uppercase tracking-widest transition-all duration-200 active:scale-95 hover:brightness-110"
            style={{
              background: "oklch(0.72 0.18 55)",
              color: "#0D0D0D",
              fontFamily: "Montserrat, sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
            }}
          >
            Ulaz Slobodan
          </a>
          <button
            className="lg:hidden text-white/70 hover:text-white p-1.5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden" style={{ background: "rgba(13,13,13,0.98)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="container py-4 flex flex-col gap-0">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="py-3.5 text-sm font-semibold text-white/60 hover:text-orange-400 transition-colors"
                style={{ fontFamily: "Inter, sans-serif", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function Hero() {
  const festivalDate = useState(() => new Date("2026-07-01T20:00:00"))[0];
  const { days, hours, minutes, seconds, expired } = useCountdown(festivalDate);

  return (
    <section id="hero" className="relative overflow-hidden" style={{ minHeight: "100svh", background: "#0D0D0D" }}>
      {/* Guitarist photo — right side, no overlay text duplication */}
      <div className="absolute inset-0 z-0">
        {/* Photo positioned to right like reference */}
        <img
          src="/brand/hero.jpg"
          alt="Dan Zauvek Festival"
          className="absolute right-0 top-0 h-full"
          style={{
            objectFit: "cover",
            objectPosition: "top center",
            width: "65%",
            filter: "brightness(0.85)",
          }}
        />
        {/* Left gradient — text area stays clean */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(105deg, rgba(13,13,13,1) 0%, rgba(13,13,13,0.97) 35%, rgba(13,13,13,0.7) 55%, rgba(13,13,13,0.15) 75%, transparent 100%)"
        }} />
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0" style={{
          height: "35%",
          background: "linear-gradient(0deg, rgba(13,13,13,1) 0%, transparent 100%)"
        }} />
      </div>

      {/* Content — left aligned, clean */}
      <div className="relative z-10 container flex flex-col justify-center" style={{ minHeight: "100svh", paddingTop: "80px", paddingBottom: "40px" }}>
        <div className="max-w-lg">

          {/* Edition label */}
          <div className="section-label mb-5">13. Muzički Festival</div>

          {/* Date — big, bold, like reference */}
          <div className="mb-3">
            <div
              className="font-black leading-none"
              style={{ fontFamily: "Montserrat, sans-serif", fontSize: "clamp(3rem, 10vw, 5.5rem)", color: "#FFFFFF" }}
            >
              01-02.
            </div>
            <div
              className="font-black leading-none"
              style={{ fontFamily: "Montserrat, sans-serif", fontSize: "clamp(3rem, 10vw, 5.5rem)", color: "oklch(0.72 0.18 55)" }}
            >
              JUL 2026.
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 mb-8">
            <MapPin size={15} style={{ color: "oklch(0.72 0.18 55)", flexShrink: 0 }} />
            <span
              className="font-semibold uppercase tracking-widest"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.75)" }}
            >
              Bašta Troja, Novi Pazar
            </span>
          </div>

          {/* Ulaz slobodan CTA */}
          <a
            href="#program"
            className="inline-flex items-center gap-2 mb-10 font-bold uppercase tracking-widest transition-all duration-200 active:scale-95"
            style={{
              border: "2px solid rgba(255,255,255,0.5)",
              color: "#FFFFFF",
              fontFamily: "Montserrat, sans-serif",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              padding: "10px 22px",
              borderRadius: "2px",
            }}
          >
            Ulaz Slobodan
          </a>

          {/* Countdown — hidden once the festival start time has passed */}
          {!expired && (
          <div>
            <div className="section-label mb-3">Odbrojavanje do festivala</div>
            <div className="flex gap-2.5">
              {[
                { value: days, label: "Dana" },
                { value: hours, label: "Sati" },
                { value: minutes, label: "Min" },
                { value: seconds, label: "Sek" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div
                    className="w-[62px] h-[62px] flex items-center justify-center font-black text-2xl text-white"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontFamily: "Montserrat, sans-serif",
                      fontVariantNumeric: "tabular-nums",
                      borderRadius: "3px",
                    }}
                  >
                    {String(value).padStart(2, "0")}
                  </div>
                  <div
                    className="mt-1.5 font-semibold uppercase tracking-widest"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "0.55rem", color: "rgba(255,255,255,0.35)" }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 animate-bounce">
        <div className="w-px h-6" style={{ background: "rgba(255,255,255,0.15)" }} />
        <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
      </div>
    </section>
  );
}

// ─── INFO STRIP ───────────────────────────────────────────────────────────────

function InfoStrip() {
  const items = [
    { icon: <Calendar size={24} />, title: "2 Dana Muzike", sub: "10 izvođača" },
    { icon: <Music size={24} />, title: "Različiti Žanrovi", sub: "Rock, jazz, folk, hip-hop..." },
    { icon: <Users size={24} />, title: "Za Sve Generacije", sub: "Dobra muzika, dobra ekipa" },
    { icon: <Ticket size={24} />, title: "Ulaz Slobodan", sub: "Zbog onih koji dolaze zbog nas" },
  ];

  return (
    <section className="py-0" style={{ background: "oklch(0.14 0 0)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center py-8 px-4 gap-3"
              style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
            >
              <div style={{ color: "oklch(0.72 0.18 55)" }}>{item.icon}</div>
              <div>
                <div className="font-black text-sm text-white uppercase tracking-wide" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {item.title}
                </div>
                <div className="text-xs text-white/40 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PROGRAM ─────────────────────────────────────────────────────────────────

function Program() {
  return (
    <section id="program" className="py-20 md:py-28" style={{ background: "#0D0D0D" }}>
      <div className="container">
        <div className="text-center mb-14 fade-in-up">
          <div className="section-label mb-3">Raspored nastupa</div>
          <h2 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Program
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-16 bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.72 0.18 55)" }} />
            <div className="h-px w-16 bg-white/10" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Day 1 */}
          <div className="fade-in-up md:px-32">
            <div className="flex items-baseline gap-3 mb-4 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <span className="text-5xl font-black" style={{ color: "oklch(0.72 0.18 55)", fontFamily: "Montserrat, sans-serif" }}>01.</span>
              <div>
                <div className="text-lg font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>Jul 2026.</div>
                <div className="text-xs text-white/40 tracking-widest uppercase" style={{ fontFamily: "Inter, sans-serif" }}>Večer Prva</div>
              </div>
            </div>
            <div className="space-y-0">
              {DAY1_ACTS.map((act, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3.5 border-b transition-colors hover:bg-white/2"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-1.5 min-w-[52px]">
                    <Clock size={11} className="text-orange-400/60" />
                    <span className="text-xs font-bold tabular-nums" style={{ color: "oklch(0.72 0.18 55)", fontFamily: "Inter, sans-serif" }}>
                      {act.time}
                    </span>
                  </div>
                  <div className="w-px h-5 bg-white/10 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm text-white uppercase truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {act.name}
                    </div>
                    <div className="text-xs text-white/35 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                      {act.genre} · {act.city}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day 2 */}
          <div className="fade-in-up md:px-32" style={{ transitionDelay: "0.1s" }}>
            <div className="flex items-baseline gap-3 mb-4 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <span className="text-5xl font-black" style={{ color: "oklch(0.72 0.18 55)", fontFamily: "Montserrat, sans-serif" }}>02.</span>
              <div>
                <div className="text-lg font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>Jul 2026.</div>
                <div className="text-xs text-white/40 tracking-widest uppercase" style={{ fontFamily: "Inter, sans-serif" }}>Večer Druga</div>
              </div>
            </div>
            <div className="space-y-0">
              {DAY2_ACTS.map((act, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3.5 border-b transition-colors hover:bg-white/2"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-1.5 min-w-[52px]">
                    <Clock size={11} className="text-orange-400/60" />
                    <span className="text-xs font-bold tabular-nums" style={{ color: "oklch(0.72 0.18 55)", fontFamily: "Inter, sans-serif" }}>
                      {act.time}
                    </span>
                  </div>
                  <div className="w-px h-5 bg-white/10 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm text-white uppercase truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {act.name}
                    </div>
                    <div className="text-xs text-white/35 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                      {act.genre} · {act.city}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-10 text-center fade-in-up">
          <p className="text-sm text-white/35 italic" style={{ fontFamily: "Inter, sans-serif" }}>
            Svi nastupi počinju u navedeno vreme. Ulaz slobodan — Bašta Troja, Novi Pazar.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── LINEUP ──────────────────────────────────────────────────────────────────

function Lineup() {
  const allActs = [
    ...DAY1_ACTS.map(a => ({ ...a, day: "01. Jul", img: a.img || PLACEHOLDER_IMG })),
    ...DAY2_ACTS.map(a => ({ ...a, day: "02. Jul", img: a.img || PLACEHOLDER_IMG })),
  ];

  const [selected, setSelected] = useState<(typeof allActs)[number] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section id="izvodjaci" className="py-20 md:py-28" style={{ background: "oklch(0.12 0 0)" }}>
      <div className="container">
        <div className="text-center mb-14 fade-in-up">
          <div className="section-label mb-3">Ko nastupa</div>
          <h2 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Izvođači
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-16 bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.72 0.18 55)" }} />
            <div className="h-px w-16 bg-white/10" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {allActs.map((act, i) => (
            <div
              key={i}
              onClick={() => {
                if (window.innerWidth >= 768) setSelected(act);
              }}
              className="dz-card rounded-sm overflow-hidden fade-in-up md:cursor-pointer"
              style={{ transitionDelay: `${i * 0.05}s` }}
            >
              {/* Photo */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={act.img}
                  alt={act.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0" style={{
                  background: "linear-gradient(0deg, rgba(13,13,13,0.9) 0%, rgba(13,13,13,0.3) 50%, transparent 100%)"
                }} />
                {/* Day badge */}
                <div
                  className="absolute top-3 right-3 px-2 py-1 text-xs font-bold rounded-sm"
                  style={{ background: "oklch(0.72 0.18 55)", color: "#0D0D0D", fontFamily: "Inter, sans-serif" }}
                >
                  {act.day}
                </div>
                {/* Time */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <Clock size={11} className="text-orange-400" />
                  <span className="text-xs font-bold text-orange-400" style={{ fontFamily: "Inter, sans-serif" }}>
                    {act.time}h
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-black text-base text-white uppercase mb-1 leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {act.name}
                </h3>
                <div className="text-xs font-semibold mb-3" style={{ color: "oklch(0.72 0.18 55)", fontFamily: "Inter, sans-serif" }}>
                  {act.genre} · {act.city}
                </div>
                <p className="text-xs text-white/45 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                  {act.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Artist detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm"
            style={{ background: "oklch(0.14 0 0)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-sm bg-black/50 text-white/70 hover:text-white transition-colors"
              aria-label="Zatvori"
            >
              <X size={18} />
            </button>
            <div className="relative aspect-video overflow-hidden">
              <img src={selected.img} alt={selected.name} className="w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(0deg, oklch(0.14 0 0) 0%, transparent 60%)" }}
              />
            </div>
            <div className="p-6">
              <span
                className="inline-block px-2 py-0.5 text-xs font-bold rounded-sm mb-3"
                style={{ background: "oklch(0.72 0.18 55)", color: "#0D0D0D", fontFamily: "Inter, sans-serif" }}
              >
                {selected.day} · {selected.time}h
              </span>
              <h3 className="text-2xl font-black text-white uppercase mb-1 leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {selected.name}
              </h3>
              <div className="text-sm font-semibold mb-4" style={{ color: "oklch(0.72 0.18 55)", fontFamily: "Inter, sans-serif" }}>
                {selected.genre} · {selected.city}
              </div>
              <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line" style={{ fontFamily: "Inter, sans-serif" }}>
                {selected.extended?.trim() ? selected.extended : selected.bio}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── O FESTIVALU ─────────────────────────────────────────────────────────────

function AboutFestival() {
  return (
    <section id="o-festivalu" className="py-20 md:py-28" style={{ background: "#0D0D0D" }}>
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left: text */}
          <div className="fade-in-up">
            <div className="section-label mb-4">Priča festivala</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
              O festivalu<br />
              <span style={{ color: "oklch(0.72 0.18 55)" }}>Dan Zauvek</span>
            </h2>

            <div className="space-y-4 text-white/60 leading-relaxed" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.95rem" }}>
              <p>
                Festival Dan Zauvek nastavlja da spaja sećanje i budućnost — muziku i emociju — prošlost i nadu.
                Nastao iz ljubavi i poštovanja prema preminulim muzičkim prijateljima, ovaj festival prerastao je
                u muzičku i umetničku tradiciju koja okuplja ceo region.
              </p>
              <p>
                Prvi put održan 2013. godine u Raški kao memorijalni koncert, Dan Zauvek je tokom godina postao
                simbol podrške mladim umetnicima, autorskoj muzici i regionalnom povezivanju. U Novom Pazaru
                festival je pronašao novu energiju i širu publiku.
              </p>
              <p>
                Festival nije samo muzički događaj. On je podsticaj na originalnost, podrška mladima i autorskom
                radu, mesto susreta muzike, poezije, fotografije i pisane reči.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {[
                { num: "13", label: "Godina tradicije" },
                { num: "100+", label: "Izvođača" },
                { num: "5000+", label: "Posetilaca" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-black" style={{ color: "oklch(0.72 0.18 55)", fontFamily: "Montserrat, sans-serif" }}>
                    {s.num}
                  </div>
                  <div className="text-xs text-white/40 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: quote + image */}
          <div className="fade-in-up" style={{ transitionDelay: "0.15s" }}>
            {/* Quote */}
            <div
              className="p-8 rounded-sm mb-6"
              style={{ background: "oklch(0.14 0 0)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="text-5xl font-black mb-4" style={{ color: "oklch(0.72 0.18 55 / 0.3)", fontFamily: "Montserrat, sans-serif", lineHeight: 1 }}>
                "
              </div>
              <blockquote className="text-xl md:text-2xl font-bold text-white italic leading-snug" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Za one koji nisu sa nama, zbog onih koji dolaze za nama.
              </blockquote>
              <div className="mt-4 text-sm text-white/40" style={{ fontFamily: "Inter, sans-serif" }}>
                — Moto festivala Dan Zauvek
              </div>
            </div>

            {/* Venue photo */}
            <div className="rounded-sm overflow-hidden aspect-video">
              <img
                src="/brand/venue.jpg"
                alt="Bašta Troja - Dan Zauvek"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── GALERIJA ────────────────────────────────────────────────────────────────

// Masonry via CSS grid row-spans: dynamic heights, but placement is fixed once set
// (so hovering never reshuffles the grid, unlike CSS multi-columns).
const GALLERY_ROW = 8; // px — grid-auto-rows unit
const GALLERY_GAP = 12; // px — must match the gap-3 class below

function GalleryTile({ img, onOpen }: { img: { src: string; alt: string }; onOpen: () => void }) {
  const [el, setEl] = useState<HTMLImageElement | null>(null);
  const [span, setSpan] = useState(24);

  useEffect(() => {
    if (!el) return;
    const recalc = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) setSpan(Math.ceil((h + GALLERY_GAP) / (GALLERY_ROW + GALLERY_GAP)));
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);

  return (
    <div
      onClick={onOpen}
      style={{ gridRowEnd: `span ${span}` }}
      className="overflow-hidden rounded-sm group cursor-pointer"
    >
      <img
        ref={setEl}
        src={img.src}
        alt={img.alt}
        loading="lazy"
        decoding="async"
        className="block w-full transition-transform duration-500 group-hover:scale-105"
        style={{ filter: "brightness(0.85) saturate(0.9)" }}
      />
    </div>
  );
}

function Gallery() {
  const [galleryImages, setGalleryImages] = useState<{ src: string; alt: string }[]>([]);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/gallery", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : []))
      .then(setGalleryImages)
      .catch(() => setGalleryImages([]));
  }, []);

  const count = galleryImages.length;
  const move = (dir: number) =>
    setLightbox(i => (i === null ? i : (i + dir + count) % count));

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, count]);

  return (
    <section id="galerija" className="py-20 md:py-28" style={{ background: "oklch(0.12 0 0)" }}>
      <div className="container">
        <div className="text-center mb-14 fade-in-up">
          <div className="section-label mb-3">Iz prethodnih godina</div>
          <h2 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Galerija
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-16 bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.72 0.18 55)" }} />
            <div className="h-px w-16 bg-white/10" />
          </div>
        </div>

        {/* Masonry grid — dynamic heights, fixed placement (no reflow on hover) */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          style={{ gridAutoRows: `${GALLERY_ROW}px` }}
        >
          {galleryImages.map((img, i) => (
            <GalleryTile key={i} img={img} onOpen={() => setLightbox(i)} />
          ))}
        </div>

        <div className="text-center mt-10 fade-in-up">
          <a
            href="https://www.instagram.com/danzauvek/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 border border-white/15 text-white/60 hover:text-orange-400 hover:border-orange-400/40 transition-all rounded-sm text-sm font-semibold"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <Instagram size={16} />
            Više fotografija na @danzauvek
          </a>
        </div>
      </div>

      {/* Fullscreen lightbox */}
      {lightbox !== null && galleryImages[lightbox] && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-sm bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Zatvori"
          >
            <X size={22} />
          </button>

          {count > 1 && (
            <button
              onClick={e => { e.stopPropagation(); move(-1); }}
              className="absolute left-3 md:left-6 z-10 p-2 md:p-3 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Prethodna"
            >
              <ChevronLeft size={26} />
            </button>
          )}

          <img
            src={galleryImages[lightbox].src}
            alt={galleryImages[lightbox].alt}
            className="max-w-[92vw] max-h-[88vh] object-contain select-none"
            onClick={e => e.stopPropagation()}
          />

          {count > 1 && (
            <button
              onClick={e => { e.stopPropagation(); move(1); }}
              className="absolute right-3 md:right-6 z-10 p-2 md:p-3 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Sledeća"
            >
              <ChevronRight size={26} />
            </button>
          )}

          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/50 tracking-widest"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {lightbox + 1} / {count}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── ARHIVA ───────────────────────────────────────────────────────────────────

function Archive() {
  const [openYear, setOpenYear] = useState<number | null>(null);

  return (
    <section id="arhiva" className="py-20 md:py-28" style={{ background: "#0D0D0D" }}>
      <div className="container">
        <div className="text-center mb-14 fade-in-up">
          <div className="section-label mb-3">13 godina tradicije</div>
          <h2 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Arhiva
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-16 bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.72 0.18 55)" }} />
            <div className="h-px w-16 bg-white/10" />
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-2">
          {ARCHIVE_YEARS.map((y, i) => (
            <div
              key={y.year}
              className="rounded-sm overflow-hidden fade-in-up"
              style={{ transitionDelay: `${i * 0.04}s`, border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/3"
                onClick={() => setOpenYear(openYear === y.year ? null : y.year)}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="text-2xl font-black w-16"
                    style={{ color: openYear === y.year ? "oklch(0.72 0.18 55)" : "rgba(255,255,255,0.3)", fontFamily: "Montserrat, sans-serif" }}
                  >
                    {y.year}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {y.edition}
                    </div>
                    <div className="text-xs text-white/40" style={{ fontFamily: "Inter, sans-serif" }}>
                      {y.location}
                    </div>
                  </div>
                </div>
                {openYear === y.year
                  ? <ChevronUp size={16} className="text-orange-400 flex-shrink-0" />
                  : <ChevronDown size={16} className="text-white/30 flex-shrink-0" />
                }
              </button>
              {openYear === y.year && (
                <div
                  className="px-5 pb-4 text-sm text-white/50 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.05)", fontFamily: "Inter, sans-serif" }}
                >
                  <p className="pt-3">{y.highlight}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── KONTAKT / VOLONTERI ─────────────────────────────────────────────────────

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", type: "volonter", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="kontakt" className="py-20 md:py-28" style={{ background: "oklch(0.12 0 0)" }}>
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          {/* Left: info */}
          <div className="fade-in-up">
            <div className="section-label mb-4">Pridruži se</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Volonteri &<br />
              <span style={{ color: "oklch(0.72 0.18 55)" }}>Kontakt</span>
            </h2>
            <p className="text-white/50 leading-relaxed mb-8" style={{ fontFamily: "Inter, sans-serif" }}>
              Festival živi zahvaljujući volonterima koji veruju u muziku i zajednicu.
              Ako želiš da budeš deo tima, prijaviš se kao medij ili sponzor — kontaktiraj nas.
            </p>

            {/* Contact info */}
            <div className="space-y-4">
              {[
                { icon: <MapPin size={16} />, label: "Lokacija", value: "Bašta Troja, Novi Pazar" },
                { icon: <Instagram size={16} />, label: "Instagram", value: "@danzauvek", href: "https://www.instagram.com/danzauvek/" },
                { icon: <Facebook size={16} />, label: "Facebook", value: "DAN ZAUVEK", href: "https://www.facebook.com/danzauvek" },
                { icon: <Globe size={16} />, label: "Web", value: "danzauvek.rs", href: "https://danzauvek.rs" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.05)", color: "oklch(0.72 0.18 55)" }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs text-white/30 uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
                      {item.label}
                    </div>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-white hover:text-orange-400 transition-colors"
                        style={{ fontFamily: "Inter, sans-serif" }}>
                        {item.value}
                      </a>
                    ) : (
                      <div className="text-sm font-semibold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                        {item.value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="fade-in-up" style={{ transitionDelay: "0.1s" }}>
            {sent ? (
              <div
                className="h-full flex flex-col items-center justify-center text-center p-8 rounded-sm"
                style={{ background: "oklch(0.14 0 0)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-5xl mb-4">🎸</div>
                <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Hvala!
                </h3>
                <p className="text-white/50" style={{ fontFamily: "Inter, sans-serif" }}>
                  Tvoja poruka je primljena. Javićemo se uskoro.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-6 md:p-8 rounded-sm space-y-5"
                style={{ background: "oklch(0.14 0 0)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    Ime i prezime
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-sm text-sm text-white placeholder-white/20 outline-none focus:border-orange-400/50 transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "Inter, sans-serif" }}
                    placeholder="Tvoje ime..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-sm text-sm text-white placeholder-white/20 outline-none focus:border-orange-400/50 transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "Inter, sans-serif" }}
                    placeholder="tvoj@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    Tip prijave
                  </label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-sm text-sm text-white outline-none focus:border-orange-400/50 transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "Inter, sans-serif" }}
                  >
                    <option value="volonter" style={{ background: "#1a1a1a" }}>Volonter</option>
                    <option value="medij" style={{ background: "#1a1a1a" }}>Medij / Press</option>
                    <option value="sponzor" style={{ background: "#1a1a1a" }}>Sponzor / Partner</option>
                    <option value="ostalo" style={{ background: "#1a1a1a" }}>Ostalo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    Poruka
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-sm text-sm text-white placeholder-white/20 outline-none focus:border-orange-400/50 transition-colors resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "Inter, sans-serif" }}
                    placeholder="Tvoja poruka..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 font-bold text-sm uppercase tracking-widest rounded-sm transition-all duration-200 active:scale-95 hover:brightness-110"
                  style={{ background: "oklch(0.72 0.18 55)", color: "#0D0D0D", fontFamily: "Montserrat, sans-serif" }}
                >
                  Pošalji Prijavu
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Google Maps */}
        <div className="mt-16 fade-in-up">
          <div className="section-label mb-4 text-center">Lokacija</div>
          <div className="rounded-sm overflow-hidden" style={{ height: "320px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2910.6081851834074!2d20.52632227700098!3d43.15475637113016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475628637a521f11%3A0x4a74c5310bc9ca56!2sTroy%20Restaurant!5e0!3m2!1sen!2srs!4v1782139130555!5m2!1sen!2srs"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bašta Troja, Novi Pazar"
            />
          </div>
          <p className="text-center text-xs text-white/30 mt-3" style={{ fontFamily: "Inter, sans-serif" }}>
            Bašta Restorana Troja, Novi Pazar — lako dostupno iz celog regiona
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: "oklch(0.08 0 0)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Slogan strip */}
      <div
        className="py-5 text-center"
        style={{ background: "oklch(0.72 0.18 55)", color: "#0D0D0D" }}
      >
        <p className="font-black text-sm md:text-base uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Vidimo se u Bašti Troja! &nbsp;·&nbsp; 01–02. Jul 2026. &nbsp;·&nbsp; Ulaz Slobodan
        </p>
      </div>

      {/* Main footer */}
      <div className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <img
                src="/brand/logo.webp"
                alt="Dan Zauvek"
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-5" style={{ fontFamily: "Inter, sans-serif" }}>
              13. Muzički Festival<br />
              Bašta Troja, Novi Pazar<br />
              01–02. Jul 2026.
            </p>
            <div className="flex gap-3">
              {[
                { href: "https://www.instagram.com/danzauvek/", icon: <Instagram size={18} /> },
                { href: "https://www.facebook.com/danzauvek", icon: <Facebook size={18} /> },
                { href: "https://danzauvek.rs", icon: <Globe size={18} /> },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-sm flex items-center justify-center text-white/40 hover:text-orange-400 transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links — hidden
          <div>
            <div className="section-label mb-5">Navigacija</div>
            <div className="space-y-3">
              {[
                { label: "Program", href: "#program" },
                { label: "Izvođači", href: "#izvodjaci" },
                { label: "O festivalu", href: "#o-festivalu" },
                { label: "Galerija", href: "#galerija" },
                { label: "Arhiva", href: "#arhiva" },
                { label: "Volonteri & Kontakt", href: "#kontakt" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="block text-sm text-white/40 hover:text-orange-400 transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          */}

          {/* Sponsors */}
          <div>
            <div className="section-label mb-5 text-right">Podrška festivalu</div>
            <div className="grid grid-cols-1 gap-3 max-w-[240px] ml-auto">
              {[
                { name: "Udruženje Dan Zauvek", abbr: "DZ" },
                { name: "Grad Novi Pazar", abbr: "NP" },
                { name: "Kulturni Centar Novi Pazar", abbr: "KC" },
              ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-2 p-3 rounded-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: "oklch(0.72 0.18 55 / 0.15)", color: "oklch(0.72 0.18 55)", fontFamily: "Montserrat, sans-serif" }}
                  >
                    {s.abbr}
                  </div>
                  <span className="text-xs text-white/30 leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs text-white/25" style={{ fontFamily: "Inter, sans-serif" }}>
            © 2026 Dan Zauvek — Udruženje, Novi Pazar. Sva prava zadržana.
          </p>
          <p className="text-xs text-white/25 italic" style={{ fontFamily: "Inter, sans-serif" }}>
            Za one koji nisu sa nama, zbog onih koji dolaze za nama.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

export default function Home() {
  useScrollAnimation();

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      <Nav />
      <Hero />
      <InfoStrip />
      <Program />
      <Lineup />
      <AboutFestival />
      <Gallery />
      {/* <Archive /> */}
      <Contact />
      <Footer />
    </div>
  );
}
