/**
 * Hero illustration: a köz dönər spit over glowing charcoal with live flames.
 * Pure SVG + CSS (no image download) to keep LCP fast on 4G.
 * Replaced by a real photo when `heroImageUrl` is configured.
 */
const EMBERS = [
  { left: "12%", delay: "0s", size: 5 },
  { left: "24%", delay: "1.4s", size: 4 },
  { left: "38%", delay: "2.8s", size: 6 },
  { left: "55%", delay: "0.7s", size: 4 },
  { left: "68%", delay: "3.5s", size: 5 },
  { left: "80%", delay: "2.1s", size: 3 },
  { left: "90%", delay: "4.2s", size: 5 },
];

function Flame({ x, scale, delay, hue }: { x: number; scale: number; delay: string; hue: "a" | "b" }) {
  return (
    <g transform={`translate(${x} 600) scale(${scale})`}>
      <path
        className="origin-bottom animate-flicker"
        style={{ animationDelay: delay, transformBox: "fill-box" }}
        d="M0 0 C-60 -40 -55 -120 -10 -180 C-12 -130 20 -110 25 -150 C60 -100 70 -40 0 0 Z"
        fill={`url(#flame-${hue})`}
      />
    </g>
  );
}

export function HeroArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="hero-glow" cx="70%" cy="100%" r="80%">
            <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#b01b15" stopOpacity="0.35" />
            <stop offset="75%" stopColor="#141110" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="flame-a" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#d7261e" />
            <stop offset="50%" stopColor="#ff5a1f" />
            <stop offset="100%" stopColor="#ffc15a" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="flame-b" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ff5a1f" />
            <stop offset="100%" stopColor="#fff1e0" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="doner-meat" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5a240d" />
            <stop offset="45%" stopColor="#a4501f" />
            <stop offset="80%" stopColor="#c86a2b" />
            <stop offset="100%" stopColor="#7a3312" />
          </linearGradient>
        </defs>

        <rect width="1200" height="600" fill="#0d0b0a" />
        <rect width="1200" height="600" fill="url(#hero-glow)" />

        {/* Dönər on the spit */}
        <g transform="translate(860 40)">
          <rect x="-6" y="0" width="12" height="520" rx="6" fill="#8d857d" />
          <path d="M-120 60 Q0 30 120 60 L85 420 Q0 450 -85 420 Z" fill="url(#doner-meat)" />
          {Array.from({ length: 9 }).map((_, i) => (
            <path
              key={i}
              d={`M${-118 + i * 4} ${95 + i * 38} Q0 ${75 + i * 38} ${118 - i * 4} ${95 + i * 38}`}
              stroke="#3d1706"
              strokeOpacity="0.55"
              strokeWidth="7"
              fill="none"
            />
          ))}
          <path d="M60 80 Q95 220 70 400" stroke="#ffc15a" strokeOpacity="0.35" strokeWidth="10" fill="none" />
        </g>

        {/* Charcoal bed */}
        <g>
          {Array.from({ length: 26 }).map((_, i) => (
            <ellipse
              key={i}
              cx={20 + i * 47}
              cy={585 - (i % 3) * 8}
              rx={34}
              ry={18}
              fill={i % 4 === 0 ? "#ff5a1f" : i % 3 === 0 ? "#d7261e" : "#2a1a14"}
              opacity={i % 4 === 0 ? 0.9 : 1}
            />
          ))}
        </g>

        {/* Flames */}
        <Flame x={120} scale={0.9} delay="0s" hue="a" />
        <Flame x={300} scale={0.6} delay="0.6s" hue="b" />
        <Flame x={470} scale={0.8} delay="1.1s" hue="a" />
        <Flame x={700} scale={1.1} delay="0.3s" hue="a" />
        <Flame x={820} scale={0.7} delay="0.9s" hue="b" />
        <Flame x={960} scale={1.2} delay="0.2s" hue="a" />
        <Flame x={1100} scale={0.8} delay="1.4s" hue="b" />
      </svg>

      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="absolute bottom-8 animate-rise rounded-full bg-gold-400 shadow-[0_0_8px_2px_rgba(255,120,40,0.8)]"
          style={{ left: e.left, width: e.size, height: e.size, animationDelay: e.delay }}
        />
      ))}

      {/* Readability scrim for the headline */}
      <div className="absolute inset-0 bg-gradient-to-r from-coal-950/95 via-coal-950/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-coal-900 to-transparent" />
    </div>
  );
}
