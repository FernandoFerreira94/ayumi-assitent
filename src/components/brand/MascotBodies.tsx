import type { MascotKind } from "./mascots";

/*
 * Corpos dos mascotes além da Bolha (prancha "Temas do Mimo"), no mesmo sistema de coordenadas de Mascot.tsx.
 * O rosto fica sempre na mesma área (170–310 × 220–310), por isso todos os humores servem para todos.
 * Cores pelas variáveis --m-* de mascot-themes.css.
 *  - shapes: silhueta, pintada duas vezes (borda furta-cor e miolo de vidro)
 *  - back: atrás da silhueta · detail: por cima do miolo · front: por cima, antes do rosto
 *  - top: onde o quadro começa (orelhas altas pedem mais espaço) · dy: quanto o alto da cabeça
 *    fica abaixo do da Bolha, para os chapéus das datas comemorativas assentarem
 */
export type Body = {
  top: number;
  dy: number;
  shapes: React.ReactNode;
  back?: React.ReactNode;
  detail?: React.ReactNode;
  front?: React.ReactNode;
  gloss: React.ReactNode;
};

const v = (name: string) => `var(--m-${name})`;

function earPair(id: string) {
  return [
    [194, -12],
    [286, 12],
  ].map(([x, r]) => (
    <g key={x} transform={`rotate(${r} ${x} 104)`}>
      <ellipse cx={x} cy="104" rx="28" ry="74" fill={`url(#${id}r)`} />
      <ellipse cx={x} cy="106" rx="18" ry="62" fill={v("body-0")} />
      <ellipse cx={x} cy="110" rx="9" ry="46" fill={v("cheek")} opacity="0.6" />
    </g>
  ));
}

const gloss = (x: number, y: number, rot: number, dx: number, dy: number, opacity = 0.85) => (
  <>
    <ellipse cx={x} cy={y} rx="30" ry="12" transform={`rotate(${rot} ${x} ${y})`} fill="#fff" opacity={opacity} />
    <circle cx={x + dx} cy={y + dy} r="6" fill="#fff" opacity={opacity} />
  </>
);

export function mascotBody(kind: Exclude<MascotKind, "bolha">, id: string): Body {
  switch (kind) {
    case "abobora":
      return {
        top: 100,
        dy: 46,
        back: (
          <>
            <path d="M240 168Q236 138 252 116" stroke={v("x")} strokeWidth="14" strokeLinecap="round" fill="none" />
            <path d="M252 132Q290 110 312 132Q284 150 252 132Z" fill="#7FA34B" />
            <path d="M256 132Q284 128 304 132" stroke={v("x")} strokeWidth="3" fill="none" />
          </>
        ),
        shapes: (
          <>
            <ellipse cx="160" cy="276" rx="86" ry="106" />
            <ellipse cx="320" cy="276" rx="86" ry="106" />
            <ellipse cx="240" cy="270" rx="104" ry="114" />
          </>
        ),
        detail: (
          <g fill="none" stroke={v("rim-0")} strokeOpacity="0.28" strokeWidth="5" strokeLinecap="round">
            <path d="M196 172Q176 270 196 372" />
            <path d="M284 172Q304 270 284 372" />
          </g>
        ),
        gloss: gloss(150, 210, -50, 26, -24),
      };
    case "mia":
      return {
        top: 85,
        dy: 36,
        shapes: (
          <>
            <path d="M136 214L142 104Q146 92 156 98L224 152Z" />
            <path d="M344 214L338 104Q334 92 324 98L256 152Z" />
            <circle cx="240" cy="264" r="124" />
          </>
        ),
        detail: (
          <>
            <path d="M150 196L154 124L198 160Z" fill={v("cheek")} opacity="0.55" />
            <path d="M330 196L326 124L282 160Z" fill={v("cheek")} opacity="0.55" />
            <path d="M232 274Q240 268 248 274L240 283Z" fill={v("cheek")} />
            <path
              d="M150 282L98 272M152 296L100 300M330 282L382 272M328 296L380 300"
              stroke={v("eye")}
              strokeOpacity="0.55"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        ),
        gloss: gloss(176, 186, -40, 34, -20),
      };
    case "caramelo":
      return {
        top: 95,
        dy: 36,
        shapes: (
          <>
            <circle cx="240" cy="258" r="118" />
            <ellipse cx="240" cy="318" rx="70" ry="54" />
          </>
        ),
        front: (
          <>
            <ellipse cx="124" cy="252" rx="40" ry="78" transform="rotate(16 124 252)" fill={v("x")} opacity="0.9" />
            <ellipse cx="356" cy="252" rx="40" ry="78" transform="rotate(-16 356 252)" fill={v("x")} opacity="0.9" />
            <ellipse cx="240" cy="282" rx="13" ry="9" fill={v("eye")} />
            <ellipse cx="236" cy="279" rx="4" ry="2.5" fill="#fff" opacity="0.6" />
            <path d="M156 358Q240 390 324 358L328 374Q240 406 152 374Z" fill={v("rim-2")} />
            <circle cx="240" cy="388" r="10" fill="#FFD08A" stroke="#E0A64E" strokeWidth="3" />
          </>
        ),
        gloss: gloss(190, 172, -34, 38, -16),
      };
    case "lulu":
      return {
        top: 25,
        dy: 46,
        back: earPair(id),
        shapes: <circle cx="240" cy="270" r="120" />,
        detail: <path d="M234 278Q240 272 246 278L240 285Z" fill={v("cheek")} />,
        gloss: gloss(172, 200, -42, 32, -22),
      };
    case "pingo":
      return {
        top: 130,
        dy: 36,
        shapes: <ellipse cx="240" cy="270" rx="126" ry="126" />,
        detail: (
          <>
            <path
              d="M124 236Q122 148 240 144Q358 148 356 236Q330 196 292 202Q262 206 240 226Q218 206 188 202Q150 196 124 236Z"
              fill={v("x")}
            />
            <ellipse cx="112" cy="300" rx="22" ry="50" transform="rotate(18 112 300)" fill={v("x")} />
            <ellipse cx="368" cy="300" rx="22" ry="50" transform="rotate(-18 368 300)" fill={v("x")} />
            <ellipse cx="204" cy="394" rx="24" ry="8" fill={v("rim-2")} />
            <ellipse cx="276" cy="394" rx="24" ry="8" fill={v("rim-2")} />
          </>
        ),
        front: <path d="M226 276Q240 268 254 276L240 290Z" fill={v("rim-2")} />,
        gloss: <ellipse cx="170" cy="176" rx="28" ry="10" transform="rotate(-30 170 176)" fill="#fff" opacity="0.35" />,
      };
    case "mel":
      return {
        top: 120,
        dy: 40,
        shapes: (
          <>
            <circle cx="148" cy="164" r="36" />
            <circle cx="332" cy="164" r="36" />
            <circle cx="240" cy="266" r="120" />
          </>
        ),
        detail: (
          <>
            <circle cx="148" cy="164" r="18" fill={v("rim-2")} opacity="0.45" />
            <circle cx="332" cy="164" r="18" fill={v("rim-2")} opacity="0.45" />
            <ellipse cx="240" cy="290" rx="44" ry="30" fill={v("x")} />
            <path d="M230 276Q240 270 250 276Q246 284 240 285Q234 284 230 276Z" fill={v("eye")} />
          </>
        ),
        gloss: gloss(176, 200, -42, 32, -20),
      };
    case "bambu":
      return {
        top: 120,
        dy: 40,
        back: (
          <>
            <circle cx="146" cy="166" r="38" fill={v("rim-0")} />
            <circle cx="334" cy="166" r="38" fill={v("rim-0")} />
          </>
        ),
        shapes: <circle cx="240" cy="266" r="122" />,
        detail: (
          <>
            <ellipse cx="200" cy="258" rx="30" ry="38" transform="rotate(20 200 258)" fill={v("x")} />
            <ellipse cx="280" cy="258" rx="30" ry="38" transform="rotate(-20 280 258)" fill={v("x")} />
            <ellipse cx="240" cy="281" rx="11" ry="7" fill={v("eye")} />
          </>
        ),
        gloss: gloss(170, 196, -42, 32, -20, 0.9),
      };
  }
}
