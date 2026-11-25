import type { GuideStep } from "@/components/ui/StepGuide";
import { Arrow, Art, Badge, Bar, Callout, Phone, Ring, T, Toggle } from "@/components/ui/GuideArt";

const RED = "#ff3b30";
const BLUE = "#007aff";

/** Passo 1: app Calendário, botão "Calendários" embaixo no meio. */
function OpenCalendars() {
  return (
    <Art>
      <Phone x={24} y={-112}>
        {/* Grade do mês (só a parte de baixo aparece) */}
        {[130, 158, 186, 214].map((y, r) =>
          [0, 1, 2, 3, 4, 5, 6].map((c) => (
            <g key={`${r}-${c}`}>
              {r === 1 && c === 3 ? <circle cx={17 + c * 21} cy={y} r={8.5} fill={RED} /> : null}
              <circle cx={17 + c * 21} cy={y} r={2.5} fill={r === 1 && c === 3 ? "#ffffff" : "#c9c6d6"} />
            </g>
          )),
        )}
        <rect x={0} y={240} width={160} height={50} fill="#fbfbfd" />
        <rect x={0} y={240} width={160} height={1} fill="#ecebf2" />
        <T x={14} y={262} size={9} fill={RED}>
          Hoje
        </T>
        <T x={80} y={262} size={9} fill={RED} anchor="middle">
          Calendários
        </T>
        <Bar x={118} y={256} w={30} h={6} fill="#f3c7c4" />
      </Phone>
      <Ring x={76} y={139} w={66} h={26} r={13} />
      <Callout x={206} y={44} w={104} lines={["Calendários"]} />
      <Arrow x1={232} y1={74} x2={146} y2={146} bend={-22} />
    </Art>
  );
}

/** Passo 2: lista de calendários, (i) ao lado do calendário do iCloud. */
function InfoButton() {
  const rows = [
    { y: 70, color: "#6d4aff", label: "Salão" },
    { y: 98, color: "#ff9500", label: "" },
    { y: 126, color: "#34c759", label: "" },
  ];
  return (
    <Art>
      <Phone x={24} y={12}>
        <T x={80} y={40} size={11} anchor="middle">
          Calendários
        </T>
        <T x={12} y={60} size={8} fill="#8e8a9e">
          ICLOUD
        </T>
        {rows.map((r) => (
          <g key={r.y}>
            <circle cx={20} cy={r.y + 7} r={7} fill={r.color} />
            <path
              d={`M16.5 ${r.y + 7} l2.5 2.5 l4.5 -5`}
              stroke="#ffffff"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {r.label ? (
              <T x={34} y={r.y + 11} size={10}>
                {r.label}
              </T>
            ) : (
              <Bar x={34} y={r.y + 4} w={60} h={6} />
            )}
            <circle cx={145} cy={r.y + 7} r={7} fill="none" stroke={BLUE} strokeWidth={1.5} />
            <T x={145} y={r.y + 10.5} size={9} anchor="middle" fill={BLUE}>
              i
            </T>
          </g>
        ))}
      </Phone>
      <Ring x={160} y={78} w={28} h={28} />
      <Callout x={210} y={40} w={100} lines={["Toque no (i)", "do calendário"]} />
      <Arrow x1={232} y1={84} x2={190} y2={94} bend={10} />
    </Art>
  );
}

/** Passo 3: Calendário Público ligado, Compartilhar Link › Copiar. */
function PublicLink() {
  return (
    <Art>
      <Phone x={20} y={12}>
        <T x={80} y={40} size={11} anchor="middle">
          Editar Calendário
        </T>
        <rect x={8} y={54} width={144} height={22} rx={8} fill="#f4f3f9" />
        <T x={16} y={69} size={9}>
          Salão
        </T>
        <rect x={8} y={88} width={144} height={52} rx={8} fill="#f4f3f9" />
        <T x={16} y={106} size={9}>
          Calendário Público
        </T>
        <Toggle x={116} y={93} />
        <rect x={16} y={116} width={128} height={1} fill="#e5e3ee" />
        <T x={16} y={133} size={9} fill={BLUE}>
          Compartilhar Link…
        </T>
      </Phone>
      <Ring x={136} y={106} w={40} h={26} r={13} />
      <Badge x={136} y={106} n={1} />
      <Ring x={36} y={135} w={102} h={22} r={11} />
      <Badge x={36} y={135} n={2} />

      <rect
        x={214}
        y={112}
        width={92}
        height={36}
        rx={18}
        fill="#ffffff"
        stroke="color-mix(in srgb, var(--primary) 45%, white)"
        strokeWidth={1.5}
      />
      <rect x={228} y={122} width={11} height={13} rx={2.5} stroke="var(--primary-text)" strokeWidth={1.6} />
      <rect
        x={232}
        y={126}
        width={11}
        height={13}
        rx={2.5}
        fill="#ffffff"
        stroke="var(--primary-text)"
        strokeWidth={1.6}
      />
      <T x={252} y={135} size={12} fill="var(--primary-text)">
        Copiar
      </T>
      <Badge x={214} y={112} n={3} />
      <Arrow x1={140} y1={150} x2={210} y2={134} bend={12} />
      <Callout x={204} y={36} w={106} lines={["Cole o link", "aqui no app"]} />
    </Art>
  );
}

/** Como ligar o Calendário Público no iPhone (iOS 17/18), com desenho em cada passo. */
export const ICLOUD_STEPS: GuideStep[] = [
  {
    art: <OpenCalendars />,
    text: (
      <>
        Abra o <b>Calendário</b> e toque em <b>Calendários</b>.
      </>
    ),
  },
  {
    art: <InfoButton />,
    text: (
      <>
        Toque no <b>(i)</b> do calendário que quer trazer (ex.: <b>Trabalho</b>).
      </>
    ),
  },
  {
    art: <PublicLink />,
    text: (
      <>
        Ligue <b>Calendário Público</b> › <b>Compartilhar Link</b> › <b>Copiar</b>.
      </>
    ),
  },
];
