import type { Season } from "./season";
import "./season.css";

/*
 * Acessórios da Bolha nas datas comemorativas (prancha "Bolha Sazonal").
 * Mesmo sistema de coordenadas do corpo em Mascot.tsx. Três camadas:
 * back = atrás do corpo, face = presa ao rosto (anda junto quando ela olha), front = por cima.
 * Movimento nas classes .szn-* de season.css (paradas com "reduzir movimento").
 */
const RIM = ["#6D4AFF", "#B9A6FF", "#FF8FB1", "#E5547F", "#8E73FF"];

const heart = (x: number, y: number, s: number) =>
  `M${x} ${y + 12 * s}C${x - 24 * s} ${y - 2 * s} ${x - 14 * s} ${y - 22 * s} ${x} ${y - 9 * s}C${x + 14 * s} ${y - 22 * s} ${x + 24 * s} ${y - 2 * s} ${x} ${y + 12 * s}Z`;
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

/** Confete com posições fixas (mesmo desenho no servidor e no aparelho). */
function confetti(n: number, seed: number, [ax, ay, aw, ah]: [number, number, number, number]) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: n }, (_, i) => {
    const x = Math.round(ax + rnd() * aw);
    const y = Math.round(ay + rnd() * ah);
    const fill = RIM[i % RIM.length];
    const style = { animationDelay: `-${(rnd() * 3).toFixed(2)}s` };
    const rot = Math.round(rnd() * 80 - 40);
    return i % 3 === 0 ? (
      <circle key={i} className="szn-fall" style={style} cx={x} cy={y} r="5" fill={fill} />
    ) : (
      <rect
        key={i}
        className="szn-fall"
        style={style}
        x={x}
        y={y}
        width="7"
        height="12"
        rx="2"
        fill={fill}
        transform={`rotate(${rot} ${x} ${y})`}
      />
    );
  });
}

const petals = (cx: number, cy: number, r: number, d: number, fill: string) =>
  [0, 72, 144, 216, 288].map((a) => (
    <circle
      key={a}
      cx={Math.round(cx + Math.cos((a * Math.PI) / 180) * d)}
      cy={Math.round(cy + Math.sin((a * Math.PI) / 180) * d)}
      r={r}
      fill={fill}
    />
  ));

type Layers = { back?: React.ReactNode; face?: React.ReactNode; front?: React.ReactNode };

export function seasonLayers(season: Season, id: string): Layers {
  switch (season) {
    case "anonovo":
      return {
        front: (
          <>
            <defs>
              <clipPath id={`${id}cone`}>
                <path d="M-40 0L0-104L40 0Z" />
              </clipPath>
            </defs>
            <g transform="translate(272 124) rotate(16) scale(0.92)">
              <path d="M-40 0L0-104L40 0Z" fill="#6D4AFF" />
              <g clipPath={`url(#${id}cone)`} fill="#FF8FB1">
                <rect x="-60" y="-34" width="120" height="14" />
                <rect x="-60" y="-66" width="120" height="12" />
                <rect x="-60" y="-94" width="120" height="10" />
              </g>
              <ellipse rx="42" ry="9" fill="#E5547F" />
              <circle cy="-106" r="13" fill="#fff" stroke="#FF8FB1" strokeWidth="4" />
            </g>
            {confetti(16, 7, [60, 20, 360, 140])}
            <path className="szn-pulse" d={sparkle(96, 120, 14)} fill="#B9A6FF" />
            <path className="szn-pulse" d={sparkle(396, 180, 10)} fill="#FF8FB1" />
          </>
        ),
      };
    case "carnaval":
      return {
        back: (
          <g fill="none" strokeWidth="6" strokeLinecap="round">
            <path d="M70 150q20-20 10-40t12-40" stroke="#FF8FB1" />
            <path d="M410 330q-24-6-22-30t-24-32" stroke="#B9A6FF" />
            <path d="M400 120q-20 10-14 34t-18 30" stroke="#6D4AFF" />
          </g>
        ),
        face: (
          <>
            <path
              fillRule="evenodd"
              fill="#E5547F"
              d="M154 250Q156 208 202 210Q230 212 240 228Q250 212 278 210Q324 208 326 250Q328 288 284 296Q256 300 240 280Q224 300 196 296Q152 288 154 250ZM181 254a21 28 0 1 0 42 0a21 28 0 1 0-42 0ZM257 254a21 28 0 1 0 42 0a21 28 0 1 0-42 0Z"
            />
            <path d="M160 246Q162 216 200 216" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
            <path d={sparkle(240, 250, 7)} fill="#fff" />
            <path d={sparkle(306, 228, 5)} fill="#fff" />
            <g className="szn-sway">
              <ellipse cx="334" cy="196" rx="10" ry="34" fill="#FF8FB1" transform="rotate(28 334 196)" />
              <ellipse cx="320" cy="188" rx="9" ry="32" fill="#B9A6FF" transform="rotate(8 320 188)" />
              <ellipse cx="346" cy="212" rx="8" ry="26" fill="#6D4AFF" transform="rotate(52 346 212)" />
            </g>
          </>
        ),
        front: <>{confetti(10, 31, [70, 30, 340, 90])}</>,
      };
    case "mulher":
      return {
        front: (
          <g className="szn-sway">
            <path d="M132 176q-24 4-30 22q22 2 34-12z" fill="#B9A6FF" />
            {petals(150, 160, 17, 19, "#FF8FB1")}
            <circle cx="150" cy="160" r="11" fill="#E5547F" />
            {petals(190, 128, 10, 11, "#B9A6FF")}
            <circle cx="190" cy="128" r="6" fill="#6D4AFF" />
          </g>
        ),
      };
    case "pascoa":
      return {
        back: (
          <>
            <g className="szn-sway">
              <ellipse cx="198" cy="68" rx="26" ry="58" fill="#FDFCFF" stroke="#B9A6FF" strokeWidth="4" transform="rotate(-10 198 68)" />
              <ellipse cx="198" cy="74" rx="12" ry="40" fill="#FF8FB1" transform="rotate(-10 198 74)" />
            </g>
            <path d="M262 120Q262 50 300 30Q340 14 352 50Q336 46 318 60Q296 80 296 124Z" fill="#FDFCFF" stroke="#B9A6FF" strokeWidth="4" />
            <path d="M276 118Q278 66 304 48Q324 38 334 50Q312 58 300 80Q290 100 290 122Z" fill="#FF8FB1" />
          </>
        ),
        front: (
          <g className="szn-float">
            <ellipse cx="378" cy="356" rx="28" ry="35" fill="#B9A6FF" />
            <path d="M351 352l9-10 9 10 9-10 9 10 9-10 9 10" fill="none" stroke="#FF8FB1" strokeWidth="6" strokeLinejoin="round" />
            <circle cx="366" cy="372" r="4" fill="#fff" />
            <circle cx="382" cy="380" r="4" fill="#fff" />
            <circle cx="392" cy="368" r="4" fill="#fff" />
            <path d="M368 332q4-8 12-10" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        ),
      };
    case "maes":
      return {
        front: (
          <>
            <g transform="translate(296 124) rotate(12)">
              <path d="M0 0C-20-26-58-30-58-6C-58 16-24 14 0 0Z" fill="#E5547F" />
              <path d="M0 0C20-26 58-30 58-6C58 16 24 14 0 0Z" fill="#E5547F" />
              <path d="M-6 4L-22 36L-10 32L-4 42L2 6Z" fill="#E5547F" />
              <path d="M6 4L22 36L10 32L4 42L-2 6Z" fill="#E5547F" />
              <path d="M-12-6C-28-18-46-18-46-8" stroke="#FF8FB1" strokeWidth="5" fill="none" strokeLinecap="round" />
              <circle r="12" fill="#FF8FB1" />
            </g>
            <path className="szn-pulse" d={heart(100, 170, 1.4)} fill="#FF8FB1" />
          </>
        ),
      };
    case "namorados":
      return {
        front: (
          <>
            <circle cx="172" cy="296" r="26" fill="#FF8FB1" opacity=".45" />
            <circle cx="308" cy="296" r="26" fill="#FF8FB1" opacity=".45" />
            {(
              [
                [96, 190, 1, "#FF8FB1", 0],
                [380, 170, 1.3, "#E5547F", 1.2],
                [120, 140, 0.8, "#B9A6FF", 2.1],
                [360, 240, 0.9, "#FF8FB1", 2.8],
                [250, 90, 0.7, "#E5547F", 0.6],
              ] as const
            ).map(([x, y, s, fill, d]) => (
              <path key={x} className="szn-rise" style={{ animationDelay: `-${d}s` }} d={heart(x, y, s)} fill={fill} />
            ))}
          </>
        ),
      };
    case "junina":
      return {
        back: (
          <>
            <path d="M40 64Q240 130 440 64" fill="none" stroke="#B9A6FF" strokeWidth="3" />
            {[60, 100, 140, 340, 380, 420].map((x, i) => {
              const y = Math.round(64 + Math.sin(((x - 40) / 400) * Math.PI) * 40);
              return <path key={x} className="szn-sway" d={`M${x - 14} ${y}L${x + 14} ${y + 2}L${x} ${y + 30}Z`} fill={RIM[i % RIM.length]} />;
            })}
          </>
        ),
        front: (
          <>
            <ellipse cx="240" cy="120" rx="124" ry="22" fill="#EBC27A" />
            <path d="M176 120Q174 56 240 50Q306 56 304 120Z" fill="#F2CF8C" />
            <path d="M176 102Q240 92 304 102L304 118Q240 108 176 118Z" fill="#E5547F" />
            <g stroke="#D9A85A" strokeWidth="3" strokeLinecap="round">
              <path d="M196 70l10 22M222 60l6 28M258 60l-4 28M284 70l-10 22" />
              <path d="M128 124l-10 6M150 132l-8 8M330 132l8 8M352 124l10 6" />
            </g>
            <g transform="rotate(10 270 75)">
              <rect x="258" y="64" width="24" height="22" rx="3" fill="#B9A6FF" />
              <rect x="258" y="64" width="24" height="22" rx="3" fill="none" stroke="#fff" strokeDasharray="4 3" strokeWidth="2" />
            </g>
            <g fill="#E5547F" opacity=".7">
              <circle cx="164" cy="290" r="3" />
              <circle cx="176" cy="298" r="3" />
              <circle cx="168" cy="304" r="3" />
              <circle cx="304" cy="290" r="3" />
              <circle cx="316" cy="298" r="3" />
              <circle cx="308" cy="304" r="3" />
            </g>
          </>
        ),
      };
    case "criancas":
      return {
        back: (
          <>
            <path d="M100 172Q118 220 138 250" fill="none" stroke="#B9A6FF" strokeWidth="3" />
            <g className="szn-float">
              <ellipse cx="96" cy="130" rx="32" ry="40" fill="#FF8FB1" />
              <path d="M92 170l4 6 4-6z" fill="#E5547F" />
              <ellipse cx="84" cy="114" rx="7" ry="12" fill="#fff" opacity=".6" transform="rotate(-20 84 114)" />
            </g>
          </>
        ),
        front: (
          <>
            <path d="M178 122Q178 66 240 62Q302 66 302 122Z" fill="#6D4AFF" />
            <path d="M226 63Q216 90 218 120L262 120Q264 90 254 63Q240 60 226 63Z" fill="#FF8FB1" />
            <path d="M290 112Q340 106 352 122Q320 130 296 124Z" fill="#8E73FF" />
            <path d="M240 62V44" stroke="#17142B" strokeWidth="5" strokeLinecap="round" />
            <g className="szn-spin">
              <ellipse cx="240" cy="42" rx="40" ry="8" fill="#FF8FB1" />
              <ellipse cx="240" cy="42" rx="8" ry="8" fill="#B9A6FF" />
            </g>
            <circle cx="240" cy="42" r="6" fill="#E5547F" />
          </>
        ),
      };
    case "halloween":
      return {
        front: (
          <>
            <ellipse cx="244" cy="116" rx="114" ry="20" fill="#2E2160" />
            <path d="M186 114Q204 70 232 36Q256 6 304 16Q272 30 266 62Q260 92 302 114Z" fill="#3B22B8" />
            <path d="M190 104Q244 92 298 104L300 116Q244 106 188 116Z" fill="#6D4AFF" />
            <rect x="232" y="96" width="20" height="16" rx="3" fill="none" stroke="#FF8FB1" strokeWidth="4" />
            <path className="szn-pulse" d={sparkle(212, 60, 8)} fill="#FF8FB1" />
            <g transform="translate(92 362)">
              <ellipse rx="34" ry="28" fill="#FFA36C" />
              <ellipse rx="14" ry="28" fill="#FF8F57" />
              <path d="M0-28q2-12 10-14" stroke="#6D4AFF" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M-16-6l6-8 6 8zM4-6l6-8 6 8zM-18 8q18 12 36 0q-8 4-18 4t-18-4z" fill="#2E2160" />
            </g>
            <g transform="translate(386 110)">
              <g className="szn-float">
                <g className="szn-flap">
                  <path d="M0 0Q-14-16-36-10Q-28-2-30 8Q-18 0-10 8Q-6 2 0 6Q6 2 10 8Q18 0 30 8Q28-2 36-10Q14-16 0 0Z" fill="#2E2160" />
                </g>
                <circle cx="-3" r="1.8" fill="#FF8FB1" />
                <circle cx="3" r="1.8" fill="#FF8FB1" />
              </g>
            </g>
          </>
        ),
      };
    case "natal":
      return {
        back: (
          <>
            {(
              [
                [90, 0],
                [140, 1.6],
                [380, 0.8],
                [420, 2.6],
                [330, 3.4],
                [60, 4.1],
              ] as const
            ).map(([x, d]) => (
              <circle key={x} className="szn-snow" style={{ animationDelay: `-${d}s` }} cx={x} cy="40" r="5" fill="#B9A6FF" opacity=".7" />
            ))}
          </>
        ),
        front: (
          <>
            <path d="M172 122C176 60 236 38 286 52C330 64 352 104 358 148C340 124 322 110 304 120Z" fill="#E5547F" />
            <path d="M196 90Q222 60 260 58" stroke="#FF8FB1" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".7" />
            <path d="M160 120Q240 96 320 120Q326 134 314 142Q240 120 166 142Q154 134 160 120Z" fill="#fff" stroke="#E6DEFF" strokeWidth="3" />
            <circle cx="358" cy="150" r="17" fill="#fff" stroke="#E6DEFF" strokeWidth="3" />
            <path className="szn-pulse" d={sparkle(110, 110, 14)} fill="#B9A6FF" />
          </>
        ),
      };
  }
}
