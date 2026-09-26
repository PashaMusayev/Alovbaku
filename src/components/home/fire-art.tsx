/**
 * Illustrated döner spit over glowing köz (charcoal) with animated flames.
 * Pure SVG: no network request, crisp at any size, respects reduced motion.
 */
export function FireArt({ className = "" }: { className?: string }) {
  const flames = [
    { x: 130, h: 70, w: 34, d: "0s" },
    { x: 165, h: 95, w: 40, d: "-0.6s" },
    { x: 200, h: 115, w: 46, d: "-1.1s" },
    { x: 235, h: 92, w: 40, d: "-0.3s" },
    { x: 270, h: 66, w: 32, d: "-1.6s" },
  ];
  const embers = [
    { x: 150, d: "0s" },
    { x: 205, d: "-2s" },
    { x: 250, d: "-4s" },
    { x: 180, d: "-3s" },
    { x: 230, d: "-1s" },
  ];
  return (
    <svg viewBox="0 0 400 360" className={className} aria-hidden focusable="false">
      <defs>
        <radialGradient id="fa-glow" cx="50%" cy="85%" r="60%">
          <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#8c1a14" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0c0a09" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fa-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff5a1f" />
          <stop offset="55%" stopColor="#ff9a3c" />
          <stop offset="100%" stopColor="#ffd36b" />
        </linearGradient>
        <linearGradient id="fa-meat" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5a2a14" />
          <stop offset="45%" stopColor="#b8642e" />
          <stop offset="70%" stopColor="#d9884a" />
          <stop offset="100%" stopColor="#6b3218" />
        </linearGradient>
        <linearGradient id="fa-coal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5a1f" />
          <stop offset="100%" stopColor="#3d1410" />
        </linearGradient>
      </defs>

      <rect width="400" height="360" fill="url(#fa-glow)" />

      {/* Spit */}
      <rect x="197" y="8" width="6" height="262" rx="3" fill="#9a8f86" />
      <ellipse cx="200" cy="44" rx="66" ry="10" fill="#3a1c0e" />

      {/* Döner cone with seared layers */}
      <path d="M134 44 H266 L238 238 H162 Z" fill="url(#fa-meat)" />
      {[70, 96, 122, 148, 174, 200, 224].map((y, i) => (
        <path
          key={y}
          d={`M${138 + i * 4} ${y} q 16 ${i % 2 ? 6 : -5} 31 0 t 31 0 t 31 0 t ${31 - i * 4} 0`}
          stroke={i % 2 ? "#4a1f0c" : "#f0a35c"}
          strokeOpacity={i % 2 ? 0.7 : 0.45}
          strokeWidth="4"
          fill="none"
        />
      ))}
      <path d="M150 52 L166 232" stroke="#ffd36b" strokeOpacity="0.25" strokeWidth="6" strokeLinecap="round" />

      {/* Flames */}
      {flames.map((f) => (
        <path
          key={f.x}
          d={`M${f.x} 300 c ${-f.w / 2} -10 ${-f.w / 2} ${-f.h * 0.55} 0 ${-f.h} c ${f.w / 2} ${f.h * 0.45} ${f.w / 2} ${f.h * 0.9} 0 ${f.h} Z`}
          fill="url(#fa-flame)"
          opacity="0.92"
          className="origin-bottom animate-flicker [transform-box:fill-box]"
          style={{ animationDelay: f.d }}
        />
      ))}

      {/* Köz — charcoal bed */}
      <rect x="96" y="296" width="208" height="30" rx="14" fill="#1f1a17" />
      {[112, 146, 182, 218, 254].map((x, i) => (
        <rect key={x} x={x} y={300 + (i % 2) * 6} width="32" height="18" rx="7" fill="url(#fa-coal)" opacity={0.75 + (i % 2) * 0.2} />
      ))}

      {/* Rising embers */}
      {embers.map((e) => (
        <circle
          key={e.x}
          cx={e.x}
          cy="300"
          r="2.4"
          fill="#ffc24a"
          className="animate-rise"
          style={{ animationDelay: e.d }}
        />
      ))}
    </svg>
  );
}
