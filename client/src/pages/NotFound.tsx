import { ArrowLeft } from "lucide-react";

const ORANGE = "oklch(0.72 0.18 55)";

export default function NotFound() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center text-center px-6"
      style={{ background: "#0D0D0D" }}
    >
      {/* 404 */}
      <div
        className="font-black leading-none"
        style={{ fontFamily: "Montserrat, sans-serif", fontSize: "clamp(5rem, 22vw, 11rem)", color: ORANGE }}
      >
        404
      </div>

      <h1
        className="font-black text-white uppercase mt-2"
        style={{ fontFamily: "Montserrat, sans-serif", fontSize: "clamp(1.5rem, 6vw, 2.5rem)", letterSpacing: "0.02em" }}
      >
        Stranica nije pronađena
      </h1>

      <p
        className="text-white/50 mt-4 max-w-md leading-relaxed"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        Stranica koju tražiš je (za razliku od Punka) dead.
      </p>

      {/* Back to homepage */}
      <a
        href="/"
        className="inline-flex items-center gap-2 mt-10 px-7 py-3 rounded-sm font-bold uppercase tracking-widest transition-all duration-200 active:scale-95 hover:brightness-110"
        style={{
          background: ORANGE,
          color: "#0D0D0D",
          fontFamily: "Montserrat, sans-serif",
          fontSize: "0.7rem",
          letterSpacing: "0.18em",
        }}
      >
        <ArrowLeft size={15} />
        Nazad na početnu
      </a>
    </div>
  );
}
