import type { FoodArt as FoodArtKind } from "@/lib/types";

/**
 * Lightweight SVG placeholder artwork (4:3) shown until a real photo is
 * uploaded. Zero network requests, crisp at any size.
 */

const CREAM = "#fff1e0";
const FLAME = "#ff5a1f";
const EMBER = "#d7261e";
const GOLD = "#ffc15a";
const BROWN = "#9a4a22";
const DARK_BROWN = "#6b2e12";
const GREEN = "#5fae4a";

function Doner() {
  return (
    <g>
      <rect x="196" y="40" width="8" height="215" rx="4" fill="#b8b0a8" />
      <path d="M150 70 Q200 55 250 70 L235 230 Q200 245 165 230 Z" fill={BROWN} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M${153 + i * 2} ${88 + i * 22} Q200 ${78 + i * 22} ${247 - i * 2} ${88 + i * 22}`}
          stroke={DARK_BROWN}
          strokeWidth="5"
          fill="none"
          opacity="0.7"
        />
      ))}
      <path d="M165 110 Q175 150 168 200" stroke={GOLD} strokeWidth="4" fill="none" opacity="0.5" />
      <ellipse cx="200" cy="255" rx="70" ry="10" fill={FLAME} opacity="0.35" />
    </g>
  );
}

function Kebab() {
  return (
    <g>
      <rect x="60" y="148" width="280" height="6" rx="3" fill="#c9c1b8" transform="rotate(-12 200 150)" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={95 + i * 55}
          y={122}
          width="48"
          height="56"
          rx="16"
          fill={i % 2 ? DARK_BROWN : BROWN}
          transform="rotate(-12 200 150)"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={140 + i * 55} cy={150 - i * 11} r="9" fill={EMBER} opacity="0.85" />
      ))}
      <ellipse cx="200" cy="240" rx="110" ry="12" fill={FLAME} opacity="0.3" />
    </g>
  );
}

function Pizza() {
  return (
    <g>
      <circle cx="200" cy="150" r="105" fill="#e0a54d" />
      <circle cx="200" cy="150" r="90" fill="#f2c265" />
      <circle cx="200" cy="150" r="84" fill={EMBER} opacity="0.35" />
      {[
        [170, 110],
        [235, 120],
        [160, 175],
        [220, 185],
        [200, 145],
        [250, 160],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="13" fill={EMBER} />
      ))}
      {[0, 60, 120].map((a) => (
        <line key={a} x1="200" y1="150" x2={200 + 105 * Math.cos((a * Math.PI) / 180)} y2={150 + 105 * Math.sin((a * Math.PI) / 180)} stroke="#c47c2c" strokeWidth="3" />
      ))}
      {[0, 60, 120].map((a) => (
        <line key={`b${a}`} x1="200" y1="150" x2={200 - 105 * Math.cos((a * Math.PI) / 180)} y2={150 - 105 * Math.sin((a * Math.PI) / 180)} stroke="#c47c2c" strokeWidth="3" />
      ))}
      <circle cx="185" cy="200" r="6" fill={GREEN} />
      <circle cx="240" cy="95" r="6" fill={GREEN} />
    </g>
  );
}

function Wrap({ color = "#e9cf9e" }: { color?: string }) {
  return (
    <g transform="rotate(-18 200 150)">
      <rect x="95" y="105" width="210" height="90" rx="45" fill={color} />
      <path d="M280 105 Q330 150 280 195 Z" fill={BROWN} />
      <path d="M285 118 Q310 150 285 182" stroke={GREEN} strokeWidth="8" fill="none" />
      <path d="M288 128 Q300 150 288 172" stroke={EMBER} strokeWidth="6" fill="none" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={130 + i * 35} y1="110" x2={120 + i * 35} y2="190" stroke="#c9a877" strokeWidth="3" />
      ))}
    </g>
  );
}

function Burger() {
  return (
    <g>
      <path d="M110 140 Q110 70 200 70 Q290 70 290 140 Z" fill="#e0a54d" />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={i} cx={150 + i * 25} cy={100 - (i % 2) * 10} rx="4" ry="2.5" fill={CREAM} />
      ))}
      <path d="M100 145 L300 145 L285 160 L115 160 Z" fill={GREEN} />
      <rect x="105" y="158" width="190" height="22" rx="8" fill={DARK_BROWN} />
      <path d="M110 178 L290 178 L270 192 L130 192 Z" fill={GOLD} />
      <rect x="105" y="190" width="190" height="22" rx="8" fill={DARK_BROWN} />
      <path d="M110 212 L290 212 Q290 240 200 240 Q110 240 110 212 Z" fill="#d89540" />
    </g>
  );
}

function Lahmacun() {
  return (
    <g>
      <ellipse cx="200" cy="155" rx="130" ry="85" fill="#e7b366" />
      <ellipse cx="200" cy="155" rx="118" ry="75" fill={EMBER} opacity="0.75" />
      {Array.from({ length: 22 }).map((_, i) => (
        <circle key={i} cx={110 + ((i * 37) % 180)} cy={110 + ((i * 23) % 90)} r="5" fill={DARK_BROWN} />
      ))}
      <path d="M150 140 Q170 130 185 145" stroke={GREEN} strokeWidth="6" fill="none" />
      <path d="M220 170 Q240 160 255 175" stroke={GREEN} strokeWidth="6" fill="none" />
      <circle cx="235" cy="125" r="10" fill="none" stroke={CREAM} strokeWidth="4" />
    </g>
  );
}

function Pide() {
  return (
    <g>
      <path d="M50 150 Q200 60 350 150 Q200 240 50 150 Z" fill="#e0a54d" />
      <path d="M85 150 Q200 90 315 150 Q200 210 85 150 Z" fill={GOLD} />
      {Array.from({ length: 12 }).map((_, i) => (
        <circle key={i} cx={120 + i * 15} cy={140 + (i % 3) * 10} r="6" fill={i % 2 ? EMBER : DARK_BROWN} />
      ))}
    </g>
  );
}

function Roll() {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${115 + i * 85} ${150 + (i === 1 ? -15 : 0)})`}>
          <circle r="42" fill="#e8a24a" />
          <circle r="34" fill="#f4efe6" />
          <circle r="16" fill={i === 0 ? GOLD : FLAME} />
          <circle r="7" fill={GREEN} cx="-8" cy="-6" />
        </g>
      ))}
      <path d="M90 225 Q200 245 310 225" stroke={GREEN} strokeWidth="4" fill="none" opacity="0.6" />
    </g>
  );
}

function Fries() {
  return (
    <g>
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={140 + i * 14} y={55 + (i % 3) * 12} width="12" height="110" rx="3" fill={GOLD} transform={`rotate(${(i - 4) * 3} 200 170)`} />
      ))}
      <path d="M125 130 L275 130 L255 250 L145 250 Z" fill={EMBER} />
      <path d="M125 130 L275 130 L270 150 L130 150 Z" fill={FLAME} />
      <circle cx="200" cy="195" r="18" fill={CREAM} opacity="0.9" />
    </g>
  );
}

function Snack() {
  return (
    <g>
      {[
        [150, 130],
        [220, 115],
        [255, 175],
        [180, 190],
        [120, 185],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="38" ry="28" fill={i % 2 ? "#d08a36" : "#e6a54b"} transform={`rotate(${i * 25} ${x} ${y})`} />
      ))}
      <circle cx="300" cy="110" r="26" fill={EMBER} />
      <circle cx="300" cy="110" r="20" fill={FLAME} opacity="0.8" />
    </g>
  );
}

function Bowl({ soup }: { soup: boolean }) {
  return (
    <g>
      {soup &&
        [0, 1, 2].map((i) => (
          <path key={i} d={`M${170 + i * 30} 95 q-12 -20 0 -40 q12 -20 0 -40`} stroke={CREAM} strokeWidth="5" fill="none" opacity="0.35" />
        ))}
      <ellipse cx="200" cy="140" rx="120" ry="30" fill={soup ? "#e39a3b" : GREEN} />
      {!soup &&
        [
          [150, 132, EMBER],
          [210, 128, "#8fd06d"],
          [250, 142, EMBER],
          [180, 146, CREAM],
          [230, 150, "#8fd06d"],
        ].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r="15" fill={c as string} />)}
      {soup && <ellipse cx="200" cy="138" rx="100" ry="20" fill={FLAME} opacity="0.5" />}
      <path d="M80 140 Q90 250 200 250 Q310 250 320 140 Z" fill={CREAM} />
      <path d="M95 160 Q200 185 305 160" stroke={FLAME} strokeWidth="5" fill="none" />
    </g>
  );
}

function Drink() {
  return (
    <g>
      <path d="M150 70 L250 70 L235 250 L165 250 Z" fill={EMBER} opacity="0.9" />
      <path d="M156 95 L244 95 L238 160 L162 160 Z" fill={CREAM} />
      <rect x="212" y="30" width="8" height="80" rx="4" fill={FLAME} transform="rotate(12 216 70)" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={180 + i * 12} cy={195 + (i % 2) * 18} r="5" fill={CREAM} opacity="0.5" />
      ))}
    </g>
  );
}

function Combo() {
  return (
    <g>
      <g transform="translate(-60 20) scale(0.8)">
        <Burger />
      </g>
      <g transform="translate(150 30) scale(0.7)">
        <Fries />
      </g>
      <g transform="translate(215 55) scale(0.6)">
        <Drink />
      </g>
    </g>
  );
}

const ART: Record<FoodArtKind, () => React.JSX.Element> = {
  doner: Doner,
  kebab: Kebab,
  pizza: Pizza,
  shawarma: () => <Wrap />,
  burger: Burger,
  lahmacun: Lahmacun,
  pide: Pide,
  roll: Roll,
  fries: Fries,
  snack: Snack,
  salad: () => <Bowl soup={false} />,
  soup: () => <Bowl soup />,
  drink: Drink,
  combo: Combo,
};

export function FoodArt({ kind, className }: { kind: FoodArtKind; className?: string }) {
  const Art = ART[kind] ?? Doner;
  const id = `bg-${kind}`;
  return (
    <svg viewBox="0 0 400 300" className={className} role="presentation" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={id} cx="50%" cy="100%" r="90%">
          <stop offset="0%" stopColor="#5a1e0c" />
          <stop offset="55%" stopColor="#241612" />
          <stop offset="100%" stopColor="#141110" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id})`} />
      <Art />
    </svg>
  );
}
