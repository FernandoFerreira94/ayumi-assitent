import type { GuideStep } from "@/components/ui/StepGuide";
import { Arrow, Art, Badge, Bar, Callout, Phone, Ring, T } from "@/components/ui/GuideArt";

const BLUE = "#007aff";
const GRAY = "#f4f3f9";

/** Bloco de ação do app Atalhos (cartão cinza arredondado). */
function Action({ y, h = 30, children }: { y: number; h?: number; children: React.ReactNode }) {
  return (
    <g>
      <rect x={8} y={y} width={144} height={h} rx={9} fill={GRAY} />
      {children}
    </g>
  );
}

/** Ícone de globo azul da ação "Obter Conteúdo do URL". */
function Globe({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={16} height={16} rx={4} fill={BLUE} />
      <circle cx={x + 8} cy={y + 8} r={4.5} stroke="#ffffff" strokeWidth={1.3} />
      <path d={`M${x + 3.5} ${y + 8} h9 M${x + 8} ${y + 3.5} v9`} stroke="#ffffff" strokeWidth={1.1} />
    </g>
  );
}

/** Passo 1: app Atalhos, botão + no canto de cima. */
function OpenApp() {
  const tiles = ["#ff9500", "#34c759", "#5856d6", "#ff2d55", "#007aff", "#af52de"];
  return (
    <Art>
      <Phone x={24} y={12}>
        <T x={12} y={50} size={14}>
          Atalhos
        </T>
        <T x={140} y={36} size={18} weight={500} fill={BLUE} anchor="middle">
          +
        </T>
        {tiles.map((c, i) => (
          <g key={c}>
            <rect x={10 + (i % 2) * 72} y={64 + Math.floor(i / 2) * 44} width={66} height={38} rx={10} fill={c} />
            <Bar x={16 + (i % 2) * 72} y={88 + Math.floor(i / 2) * 44} w={40} h={6} fill="rgba(255,255,255,.7)" />
          </g>
        ))}
      </Phone>
      <Ring x={154} y={28} w={24} h={24} />
      <Callout x={206} y={30} w={104} lines={["Abra Atalhos", "e toque no +"]} />
      <Arrow x1={206} y1={52} x2={182} y2={42} bend={-8} />
    </Art>
  );
}

/** Passo 2: nome do Atalho = a frase que você fala para a Siri. */
function NameIt() {
  return (
    <Art>
      <Phone x={24} y={12}>
        <T x={80} y={50} size={11} anchor="middle">
          Agenda de hoje ⌄
        </T>
        <rect x={8} y={60} width={144} height={24} rx={8} fill={GRAY} />
        <T x={18} y={76} size={9} weight={600} fill="#8e8a9e">
          Buscar ações
        </T>
        <Bar x={12} y={100} w={110} />
        <Bar x={12} y={116} w={80} />
        <Bar x={12} y={132} w={96} />
      </Phone>
      <Ring x={60} y={52} w={108} h={22} r={11} />
      <Callout x={204} y={26} w={106} lines={["Renomeie com", "a frase da Siri"]} />
      <Arrow x1={210} y1={60} x2={172} y2={62} bend={-6} />
    </Art>
  );
}

/** Passo 3: buscar e adicionar "Obter Conteúdo do URL". */
function AddUrl() {
  return (
    <Art>
      <Phone x={24} y={12}>
        <rect x={8} y={34} width={144} height={24} rx={8} fill={GRAY} />
        <T x={18} y={50} size={9}>
          conteúdo do URL
        </T>
        <rect x={8} y={68} width={144} height={30} rx={9} fill="#ffffff" stroke="#ecebf2" />
        <Globe x={16} y={75} />
        <T x={38} y={87} size={9}>
          Obter Conteúdo do URL
        </T>
        <Bar x={12} y={114} w={100} />
        <Bar x={12} y={130} w={70} />
      </Phone>
      <Ring x={32} y={80} w={144} h={30} r={10} />
      <Callout x={204} y={34} w={106} lines={["Busque e toque", "nesta ação"]} />
      <Arrow x1={220} y1={68} x2={180} y2={92} bend={-8} />
    </Art>
  );
}

/** Passo 4: tocar em URL, colar o endereço e abrir a seta. */
function PasteUrl() {
  return (
    <Art>
      <Phone x={24} y={12}>
        <Action y={40} h={48}>
          <Globe x={14} y={48} />
          <T x={36} y={60} size={8.5} weight={600}>
            Obter conteúdo de
          </T>
          <rect x={36} y={66} width={30} height={15} rx={5} fill="#dbe9ff" />
          <T x={51} y={77} size={8} fill={BLUE} anchor="middle">
            URL
          </T>
          <T x={142} y={68} size={12} fill="#8e8a9e" anchor="middle">
            ›
          </T>
        </Action>
        <Bar x={12} y={106} w={100} />
        <Bar x={12} y={122} w={70} />
      </Phone>
      <Ring x={62} y={80} w={38} h={21} r={8} />
      <Badge x={108} y={90} n={1} />
      <Ring x={161} y={70} w={20} h={24} r={8} />
      <Badge x={181} y={70} n={2} />
      <Callout x={200} y={110} w={112} lines={["1 Cole o endereço", "2 Toque na seta"]} />
      <Arrow x1={226} y1={110} x2={182} y2={94} bend={-10} />
    </Art>
  );
}

/** Passo 5: Cabeçalhos › Authorization = a autorização copiada. */
function Header() {
  return (
    <Art>
      <Phone x={24} y={-20}>
        <Action y={46} h={118}>
          <T x={16} y={64} size={8.5} weight={600}>
            Método
          </T>
          <T x={144} y={64} size={8.5} fill={BLUE} anchor="end">
            GET
          </T>
          <rect x={16} y={72} width={128} height={1} fill="#e5e3ee" />
          <T x={16} y={88} size={8.5} weight={600}>
            Cabeçalhos
          </T>
          <rect x={16} y={96} width={128} height={38} rx={6} fill="#ffffff" />
          <T x={22} y={110} size={8}>
            Authorization
          </T>
          <T x={22} y={126} size={8} fill={BLUE}>
            Bearer bub_•••••
          </T>
          <T x={16} y={152} size={8.5} fill={BLUE}>
            + Adicionar novo campo
          </T>
        </Action>
      </Phone>
      <Ring x={42} y={80} w={124} h={34} r={8} />
      <Callout x={204} y={34} w={106} lines={["2 Chave e valor", "do cabeçalho"]} />
      <Arrow x1={214} y1={68} x2={170} y2={92} bend={-8} />
      <Ring x={42} y={124} w={126} h={18} r={9} />
      <Badge x={42} y={124} n={1} />
      <Badge x={42} y={80} n={2} />
      <Callout x={204} y={122} w={106} lines={["1 Toque aqui"]} />
      <Arrow x1={204} y1={136} x2={172} y2={134} bend={6} />
    </Art>
  );
}

/** Passo 6: a Siri fala o que veio do endereço. */
function SpeakResult() {
  return (
    <Art>
      <Phone x={24} y={0}>
        <Action y={30}>
          <Globe x={14} y={37} />
          <Bar x={36} y={42} w={90} h={6} />
        </Action>
        <Action y={68} h={44}>
          <rect x={14} y={75} width={16} height={16} rx={4} fill="#ff3b30" />
          <T x={36} y={86} size={8.5} weight={600}>
            Falar
          </T>
          <rect x={36} y={92} width={96} height={14} rx={5} fill="#dbe9ff" />
          <T x={84} y={102} size={8} fill={BLUE} anchor="middle">
            Conteúdos do URL
          </T>
        </Action>
      </Phone>
      <Ring x={34} y={70} w={140} h={42} r={10} />
      <Callout x={196} y={30} w={118} lines={["Adicione Falar", "e toque em OK"]} />
      <Arrow x1={226} y1={66} x2={178} y2={88} bend={-8} />
    </Art>
  );
}

/** Passo 7: falar com a Siri. */
function AskSiri() {
  return (
    <Art>
      <defs>
        <radialGradient id="siri-orb" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffd1f1" />
          <stop offset="45%" stopColor="#a974ff" />
          <stop offset="100%" stopColor="#2f7bff" />
        </radialGradient>
      </defs>
      <circle cx={70} cy={96} r={38} fill="url(#siri-orb)" />
      <circle className="guide-pulse" cx={70} cy={96} r={46} stroke="var(--primary)" strokeWidth={3} />
      <rect x={128} y={34} width={180} height={40} rx={18} fill="var(--primary)" />
      <T x={218} y={58} size={12} fill="#ffffff" anchor="middle">
        E aí Siri, agenda de hoje
      </T>
      <rect x={128} y={88} width={180} height={64} rx={18} fill="#ffffff" stroke="#ecebf2" strokeWidth={1.5} />
      <T x={140} y={108} size={10.5}>
        Hoje você tem 3 clientes.
      </T>
      <T x={140} y={124} size={10.5} weight={600} fill="#5c5873">
        9h Ana, Design de sobrancelha.
      </T>
      <T x={140} y={140} size={10.5} weight={600} fill="#5c5873">
        10h30 Bia, Unha…
      </T>
    </Art>
  );
}

/** Como montar um Atalho que pergunta a agenda ao Bubbly (iOS 17/18), com desenho em cada passo. */
export const ATALHO_STEPS: GuideStep[] = [
  {
    art: <OpenApp />,
    text: (
      <>
        Abra o app <b>Atalhos</b> e toque no <b>+</b>.
      </>
    ),
  },
  {
    art: <NameIt />,
    text: (
      <>
        Toque no nome lá em cima e escreva a frase, por exemplo <b>Agenda de hoje</b>. É isso que você fala para a Siri.
      </>
    ),
  },
  {
    art: <AddUrl />,
    text: (
      <>
        Em <b>Buscar ações</b>, procure <b>Obter Conteúdo do URL</b> e toque nela.
      </>
    ),
  },
  {
    art: <PasteUrl />,
    text: (
      <>
        Copie o <b>endereço</b> aqui no Bubbly, toque em <b>URL</b> e cole. Depois toque na <b>seta</b> para ver mais.
      </>
    ),
  },
  {
    art: <Header />,
    text: (
      <>
        Em <b>Cabeçalhos</b>, toque em <b>Adicionar novo campo</b>. Chave: <b>Authorization</b>. Valor: cole a{" "}
        <b>autorização</b> copiada aqui no Bubbly.
      </>
    ),
  },
  {
    art: <SpeakResult />,
    text: (
      <>
        Adicione a ação <b>Falar</b> (ela já usa o <b>Conteúdo do URL</b>) e toque em <b>OK</b>.
      </>
    ),
  },
  {
    art: <AskSiri />,
    text: (
      <>
        Pronto. Diga <b>&quot;E aí Siri, agenda de hoje&quot;</b> e ouça a resposta. Repita para as outras frases.
      </>
    ),
  },
];
