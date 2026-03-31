




import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

// ── Glitch text hook ──────────────────────────────────────────────────────────
const GLITCH_CHARS = "!<>-_\\/[]{}—=+*^?#@$%&";

function useGlitchText(target: string, intervalMs = 40, revealDelay = 0) {
  const [display, setDisplay] = useState(() => target.replace(/./g, "_"));
  const frame = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timer.current = setTimeout(() => {
      const revealed = new Array(target.length).fill(false);
      const id = setInterval(() => {
        frame.current++;
        const next = target
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (revealed[i]) return char;
            if (frame.current > i * 3) {
              if (Math.random() < 0.3) revealed[i] = true;
              return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
            }
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          })
          .join("");
        setDisplay(next);
        if (revealed.every(Boolean)) clearInterval(id);
      }, intervalMs);
      return () => clearInterval(id);
    }, revealDelay);
    return () => clearTimeout(timer.current);
  }, [target, intervalMs, revealDelay]);

  return display;
}

// ── Scanline canvas ───────────────────────────────────────────────────────────
function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
      }}
    />
  );
}

// ── Floating noise blobs ──────────────────────────────────────────────────────
function NoiseBlobs() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
      <div style={blobStyle("#ff003322", "60%", "20%", 520, 6)} />
      <div style={blobStyle("#00ffcc11", "10%", "55%", 440, 9)} />
      <div style={blobStyle("#ffffff08", "75%", "70%", 380, 12)} />
    </div>
  );
}

function blobStyle(color: string, left: string, top: string, size: number, delay: number): React.CSSProperties {
  return {
    position: "absolute",
    left,
    top,
    width: size,
    height: size,
    borderRadius: "50%",
    background: color,
    filter: "blur(80px)",
    animation: `blobDrift ${18 + delay}s ease-in-out ${delay}s infinite alternate`,
  };
}

// ── Terminal log lines ────────────────────────────────────────────────────────
const LOG_LINES = [
  { delay: 0,    text: "› SYSTEM  initializing error boundary..." },
  { delay: 600,  text: "› ROUTER  resolving path..." },
  { delay: 1200, text: "› ROUTER  no match found — status 404" },
  { delay: 1900, text: "› LOGGER  event dispatched to console" },
  { delay: 2500, text: "› UI      rendering fallback component" },
];

function TerminalLogs({ path }: { path: string }) {
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    LOG_LINES.forEach(({ delay }, i) => {
      setTimeout(() => setVisible((v) => [...v, i]), delay);
    });
  }, []);

  return (
    <div style={{
      fontFamily: "'Fira Code', 'Cascadia Code', monospace",
      fontSize: 11,
      color: "#ffffff40",
      lineHeight: 1.8,
      marginTop: 32,
      minHeight: 120,
    }}>
      {LOG_LINES.map(({ text }, i) =>
        visible.includes(i) ? (
          <div
            key={i}
            style={{
              animation: "fadeSlideUp 0.3s ease forwards",
              color: i === 2 ? "#ff4d4d80" : "#ffffff35",
            }}
          >
            {i === 2 ? `${text}  [ ${path} ]` : text}
          </div>
        ) : null
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  const headingText = useGlitchText("PAGE NOT FOUND", 35, 300);
  const codeText    = useGlitchText("404", 45, 0);

  useEffect(() => {
    setMounted(true);
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      {/* ── Global keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Bebas+Neue&family=Inter:wght@300;400&display=swap');

        @keyframes blobDrift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(40px, 30px) scale(1.1); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glitchShift {
          0%,100% { clip-path: inset(0 0 98% 0); transform: translate(-4px, 0); }
          20%     { clip-path: inset(30% 0 60% 0); transform: translate(4px, 0); }
          40%     { clip-path: inset(70% 0 15% 0); transform: translate(-2px, 0); }
          60%     { clip-path: inset(10% 0 85% 0); transform: translate(3px, 0); }
          80%     { clip-path: inset(50% 0 40% 0); transform: translate(-3px, 0); }
        }
        @keyframes glitchShift2 {
          0%,100% { clip-path: inset(90% 0 5% 0); transform: translate(3px, 0); color: #00ffcc; }
          33%     { clip-path: inset(40% 0 50% 0); transform: translate(-4px, 0); color: #ff003c; }
          66%     { clip-path: inset(15% 0 80% 0); transform: translate(2px, 0); color: #00ffcc; }
        }
        @keyframes mountReveal {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineExpand {
          from { width: 0; }
          to   { width: 100%; }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 0px #ff003c00; }
          50%     { box-shadow: 0 0 24px #ff003c55; }
        }
        @keyframes cursorBlink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0; }
        }

        .btn-home {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.18);
          color: #fff;
          font-family: 'Fira Code', monospace;
          font-size: 13px;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          text-decoration: none;
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .btn-home:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.5);
        }
        .btn-home::before {
          content: '';
          position: absolute;
          bottom: -1px; left: 0;
          height: 1px;
          background: linear-gradient(90deg, #ff003c, #00ffcc);
          animation: lineExpand 0.6s ease 3.2s forwards;
          width: 0;
        }

        .back-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          font-family: 'Fira Code', monospace;
          font-size: 11px;
          cursor: pointer;
          padding: 8px 0;
          letter-spacing: 0.05em;
          transition: color 0.2s;
        }
        .back-btn:hover { color: rgba(255,255,255,0.6); }
      `}</style>

      <ScanlineOverlay />
      <NoiseBlobs />

      {/* ── Page ── */}
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080808",
        padding: "40px 24px",
        position: "relative",
        zIndex: 1,
        opacity: mounted ? 1 : 0,
        animation: mounted ? "mountReveal 0.6s ease 0.1s both" : undefined,
      }}>
        <div style={{ maxWidth: 560, width: "100%" }}>

          {/* ── 404 number ── */}
          <div style={{ position: "relative", display: "inline-block", lineHeight: 1, marginBottom: 8 }}>
            {/* Base */}
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(96px, 18vw, 160px)",
              color: "#fff",
              letterSpacing: "-0.02em",
              userSelect: "none",
            }}>
              {codeText}
            </span>
            {/* Glitch layer 1 */}
            <span aria-hidden style={{
              position: "absolute", inset: 0,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(96px, 18vw, 160px)",
              color: "#ff003c",
              letterSpacing: "-0.02em",
              animation: "glitchShift 3.5s steps(1) 1.5s infinite",
              userSelect: "none",
            }}>
              {codeText}
            </span>
            {/* Glitch layer 2 */}
            <span aria-hidden style={{
              position: "absolute", inset: 0,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(96px, 18vw, 160px)",
              letterSpacing: "-0.02em",
              animation: "glitchShift2 4.2s steps(1) 2.1s infinite",
              userSelect: "none",
            }}>
              {codeText}
            </span>
          </div>

          {/* ── Divider ── */}
          <div style={{
            height: 1,
            background: "linear-gradient(90deg, #ff003c, #00ffcc40, transparent)",
            marginBottom: 20,
          }} />

          {/* ── Heading ── */}
          <h1 style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: "clamp(14px, 2.5vw, 18px)",
            fontWeight: 500,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: "0.18em",
            margin: "0 0 6px",
          }}>
            {headingText}
            <span style={{ animation: "cursorBlink 1s step-end infinite", color: "#00ffcc" }}>_</span>
          </h1>

          {/* ── Subtext ── */}
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
            margin: "0 0 0",
            letterSpacing: "0.03em",
          }}>
            The route{" "}
            <code style={{
              fontFamily: "'Fira Code', monospace",
              color: "rgba(255, 77, 77, 0.7)",
              background: "rgba(255,77,77,0.08)",
              padding: "1px 6px",
              borderRadius: 3,
              fontSize: 12,
            }}>
              {location.pathname}
            </code>{" "}
            does not exist in this system.
          </p>

          {/* ── Terminal logs ── */}
          <TerminalLogs path={location.pathname} />

          {/* ── Actions ── */}
          <div style={{ marginTop: 36, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/" className="btn-home">
              <span style={{ color: "#00ffcc", fontSize: 10 }}>▶</span>
              cd ~/home
            </a>
            <button className="back-btn" onClick={() => navigate(-1)}>
              ← go back
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default NotFound;
