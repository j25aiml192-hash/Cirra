"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Deterministic blob data to prevent hydration mismatches
const BLOBS_DATA = [
  { size: 280, left: 12, top: 18, animationDelay: -3, animationDuration: 18 },
  { size: 230, left: 72, top: 14, animationDelay: -7, animationDuration: 22 },
  { size: 320, left: 42, top: 58, animationDelay: -12, animationDuration: 25 },
  { size: 190, left: 18, top: 76, animationDelay: -2, animationDuration: 19 },
  { size: 270, left: 82, top: 68, animationDelay: -15, animationDuration: 23 },
  { size: 180, left: 52, top: 22, animationDelay: -9, animationDuration: 20 },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep track of the blob DOM elements for high-performance updates
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      // Apply subtle parallax effect to each blob
      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const speed = (index + 1) * 18;
          blob.style.marginLeft = `${x * speed}px`;
          blob.style.marginTop = `${y * speed}px`;
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("cirra_token", "sample_session_token");
    }
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  return (
    <div className="mercury-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;800;900&family=Space+Mono:wght@400;700&display=swap');

        .mercury-wrapper {
          --bg: #05070E;
          --mercury: #E2E8F0;
          --mercury-glow: #0062E0;
          --mercury-dark: #64748B;
          --accent: #FFFFFF;
          --text-dim: rgba(255, 255, 255, 0.55);
          --filter-goo: url('#gooey');
          background-color: var(--bg);
          color: var(--accent);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          min-height: 100vh;
          width: 100vw;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .mercury-wrapper * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }

        /* Background Liquid Physics Simulation */
        .stage {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
          filter: var(--filter-goo);
          opacity: 0.65;
          pointer-events: none;
        }

        .blob {
          position: absolute;
          background: linear-gradient(135deg, #FFFFFF 0%, #94A3B8 50%, #0062E0 100%);
          border-radius: 50%;
          filter: blur(22px);
          animation: mercury-float 22s infinite alternate ease-in-out;
          box-shadow: inset -10px -10px 25px rgba(0, 0, 0, 0.6), 
                      10px 10px 35px rgba(0, 98, 224, 0.35);
          transition: margin 0.1s ease-out;
        }

        @keyframes mercury-float {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(8vw, 16vh) scale(1.18); }
          66% { transform: translate(-6vw, 8vh) scale(0.85); }
          100% { transform: translate(6vw, -8vh) scale(1.1); }
        }

        /* Interface Container */
        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 32px 24px;
        }

        .header {
          margin-bottom: 48px;
          text-align: left;
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .brand-id {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: var(--text-dim);
          display: block;
        }

        .header h1 {
          font-weight: 900;
          font-size: clamp(2.4rem, 6vw, 3.2rem);
          line-height: 0.92;
          letter-spacing: -2px;
          margin-left: -2px;
          margin-top: 0;
          color: #FFFFFF;
          text-shadow: 0 0 30px rgba(0, 98, 224, 0.4);
        }

        /* Form Elements */
        .form-group {
          position: relative;
          margin-bottom: 28px;
          transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
        }

        .form-group:focus-within {
          transform: translateX(8px);
        }

        .form-group label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .form-group input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--accent);
          padding: 10px 0;
          font-size: 17px;
          outline: none;
          transition: border-color 0.4s;
          font-family: 'Inter', sans-serif;
        }

        .form-group input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .input-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 2px;
          background: linear-gradient(90deg, #38BDF8, #0062E0);
          transition: width 0.5s cubic-bezier(0.2, 1, 0.3, 1);
          box-shadow: 0 0 16px #38BDF8;
        }

        .form-group input:focus + .input-glow {
          width: 100%;
        }

        /* The Mercury Button */
        .submit-wrap {
          margin-top: 44px;
          position: relative;
          filter: var(--filter-goo);
        }

        .btn-base {
          background: #FFFFFF;
          color: #05070E;
          border: none;
          padding: 18px 36px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          cursor: pointer;
          width: 100%;
          position: relative;
          z-index: 2;
          border-radius: 9999px;
          transition: letter-spacing 0.3s, background-color 0.3s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-base:hover {
          letter-spacing: 4px;
          background: #F8FAFC;
        }

        .btn-base:active {
          transform: scale(0.98);
        }

        .mercury-drop {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #0062E0, #38BDF8);
          transform: translate(-50%, -50%);
          z-index: 1;
          border-radius: 9999px;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          opacity: 0.8;
        }

        .submit-wrap:hover .mercury-drop {
          transform: translate(-50%, -50%) scale(1.04, 1.25);
          filter: brightness(1.25);
        }

        /* Utility */
        .footer-nav {
          margin-top: 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
        }

        .footer-nav a {
          color: var(--text-dim);
          text-decoration: none;
          transition: color 0.3s;
          text-transform: uppercase;
        }

        .footer-nav a:hover {
          color: #38BDF8;
        }

        .svg-filter-hidden {
          position: absolute;
          width: 0;
          height: 0;
          pointer-events: none;
        }
      `}</style>

      {/* SVG Gooey Filter */}
      <svg className="svg-filter-hidden" aria-hidden="true">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Ambient Liquid Physics Stage */}
      <div className="stage" id="stage">
        {BLOBS_DATA.map((data, index) => (
          <div
            key={index}
            ref={(el) => {
              blobRefs.current[index] = el;
            }}
            className="blob"
            style={{
              width: `${data.size}px`,
              height: `${data.size}px`,
              left: `${data.left}%`,
              top: `${data.top}%`,
              animationDelay: `${data.animationDelay}s`,
              animationDuration: `${data.animationDuration}s`,
            }}
          />
        ))}
      </div>

      {/* Interactive Interface */}
      <main className="auth-container">
        <header className="header">
          <div className="brand-badge">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <img
                src="/cirra-logo.png"
                alt="Cirra"
                className="w-8 h-8 rounded-lg object-contain shadow-md border border-white/20 group-hover:scale-105 transition-transform"
              />
              <span className="text-white font-black tracking-wider text-sm">CIRRA</span>
            </Link>
          </div>
          <span className="brand-id">SYSTEM NODE: 0x992 // FOCUS 1.0</span>
          <h1>NEURAL<br />ACCESS</h1>
        </header>

        <form autoComplete="off" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Work Email</label>
            <input
              type="email"
              placeholder="operator@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="input-glow"></div>
          </div>

          <div className="form-group">
            <label>Sequence Key</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="input-glow"></div>
          </div>

          <div className="submit-wrap">
            <div className="mercury-drop"></div>
            <button type="submit" className="btn-base" disabled={isSubmitting}>
              {isSubmitting ? "INITIALIZING..." : "INITIALIZE STREAM"}
            </button>
          </div>
        </form>

        <footer className="footer-nav">
          <Link href="/">← RETURN HOME</Link>
        </footer>
      </main>
    </div>
  );
}
