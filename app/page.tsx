import { Suspense } from "react";
import { AuthCta } from "@/components/AuthCta";

function CtaFallback({ size = "md" }: { size?: "md" | "lg" }) {
  const className = size === "lg" ? "btn-primary lg" : "btn-primary";
  return (
    <a className={className} href="/auth/login?returnTo=/play">
      Parent sign in
    </a>
  );
}

export default function HomePage() {
  return (
    <div className="home">
      <div className="bubbles" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} style={{ left: `${6 + i * 7}%`, animationDelay: `${i * 0.35}s` }} />
        ))}
      </div>
      <header className="home-nav">
        <span className="wordmark">Type Splash</span>
        <Suspense fallback={<CtaFallback />}>
          <AuthCta />
        </Suspense>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">For Xavier · two hands on the home row</p>
          <h1>
            Dive in.
            <br />
            Type the letter.
            <br />
            Race your ghosts.
          </h1>
          <p className="lede">
            Type Splash is a bright 25-meter freestyle for kids learning home-row
            typing. One big letter at a time. No next-letter peeking. Correct keys
            swim him forward. Misses just make a bubbly bonk.
          </p>
          <div className="hero-cta">
            <Suspense fallback={<CtaFallback size="lg" />}>
              <AuthCta size="lg" />
            </Suspense>
            <p>Laptop or desktop with a real keyboard. No phones, no touch.</p>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 420 360" className="hero-svg">
            <defs>
              <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            <rect x="18" y="40" width="384" height="280" rx="32" fill="url(#water)" />
            <ellipse cx="110" cy="120" rx="50" ry="10" fill="#fff" opacity="0.18" />
            <ellipse cx="280" cy="200" rx="70" ry="12" fill="#fff" opacity="0.12" />
            <g transform="translate(150 150)">
              <ellipse cx="40" cy="70" rx="46" ry="14" fill="#e0f2fe" opacity="0.5" />
              <ellipse cx="18" cy="48" rx="10" ry="18" fill="#d4a06a" />
              <ellipse cx="58" cy="50" rx="10" ry="18" fill="#d4a06a" />
              <ellipse cx="38" cy="28" rx="22" ry="24" fill="#4b5563" />
              <ellipse cx="30" cy="26" rx="8" ry="12" fill="#1f2937" />
              <ellipse cx="46" cy="32" rx="7" ry="9" fill="#22c55e" />
              <circle cx="38" cy="4" r="16" fill="#d4a06a" />
              <ellipse cx="38" cy="-2" rx="17" ry="10" fill="#141414" />
              <rect x="26" y="-6" width="24" height="4" rx="2" fill="#4ade80" />
              <circle cx="32" cy="4" r="2.2" fill="#2a1b12" />
              <circle cx="44" cy="4" r="2.2" fill="#2a1b12" />
            </g>
            <text x="210" y="300" textAnchor="middle" fill="#082f49" fontSize="22" fontFamily="Fredoka, sans-serif">
              25m home-row freestyle
            </text>
          </svg>
        </div>
      </section>

      <section className="features" id="features">
        <h2>How the race works</h2>
        <ul>
          <li>
            <strong>On your marks… get set… BEEP!</strong>
            Xavier dives in. The clock starts at the beep and stops on the 25th correct letter.
          </li>
          <li>
            <strong>One letter, no peeking.</strong>
            A random home-row key — a s d f j k l ; — fills the pool. There is no next-letter preview.
          </li>
          <li>
            <strong>Swim or bonk.</strong>
            The right key moves him one meter. A wrong key pops a gentle bubble. No extra penalties. The timer keeps running.
          </li>
          <li>
            <strong>Hands and fingers.</strong>
            The on-screen keyboard lights the target key and names the hand and finger. F and J show the home-row bumps.
          </li>
          <li>
            <strong>Ghost lanes.</strong>
            First race is a solo time trial. After that, up to three of his fastest swims replay beside him from the timestamp of each correct key.
          </li>
          <li>
            <strong>Medals and PBs.</strong>
            Beat a ghost and earn a medal. Beat himself and the pool throws confetti for a new personal best.
          </li>
        </ul>
      </section>

      <section className="parents">
        <div>
          <h2>Parents sign in. Kids just swim.</h2>
          <p>
            Focus signs in with Auth0. Xavier plays on that account — no extra
            kid login, no scores shared with anyone else. Each run is saved so
            tomorrow&apos;s ghosts are today&apos;s best times.
          </p>
        </div>
        <Suspense fallback={<CtaFallback size="lg" />}>
          <AuthCta size="lg" />
        </Suspense>
      </section>

      <footer className="home-foot">
        <p>Type Splash · built for Xavier · laptop keyboard only</p>
      </footer>
    </div>
  );
}
