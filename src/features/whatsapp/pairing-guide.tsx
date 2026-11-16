import type { GuideStep } from "@/components/ui/StepGuide";
import { Arrow, Art, Badge, Bar, Callout, Phone, Ring, T } from "@/components/ui/GuideArt";

const WA = "#1daa61";

/** Passo 1: aba Configurações, embaixo à direita (iPhone). */
function OpenSettings() {
  // Celular cortado em cima: aparece só a parte de baixo, com a barra de abas.
  const tabs = [16, 48, 80, 112, 144];
  return (
    <Art>
      <Phone x={24} y={-112}>
        {[124, 162, 200].map((y) => (
          <g key={y}>
            <circle cx={22} cy={y + 8} r={11} fill="#e7f7ee" />
            <Bar x={40} y={y} w={70} />
            <Bar x={40} y={y + 12} w={96} h={6} fill="#f1eff8" />
          </g>
        ))}
        <rect x={0} y={238} width={160} height={52} fill="#fbfbfd" />
        <rect x={0} y={238} width={160} height={1} fill="#ecebf2" />
        {tabs.map((x, i) => (
          <circle key={x} cx={x} cy={256} r={7} fill={i === 4 ? WA : "#c9c6d6"} />
        ))}
        <circle cx={144} cy={256} r={3} fill="#ffffff" />
      </Phone>
      <Ring x={157} y={135} w={32} h={32} />
      <Callout x={206} y={44} w={104} lines={["Configurações"]} />
      <Arrow x1={240} y1={74} x2={190} y2={140} bend={-18} />
    </Art>
  );
}

/** Passo 2: Aparelhos conectados › Conectar um aparelho (duas telas). */
function LinkedDevices() {
  return (
    <Art>
      <Phone x={12} y={12} w={140} h={260}>
        <T x={12} y={42} size={12}>
          Configurações
        </T>
        {[58, 86, 114, 142].map((y, i) => (
          <g key={y}>
            <rect x={12} y={y} width={14} height={14} rx={4} fill={i === 1 ? WA : "#dcd9e8"} />
            {i === 1 ? (
              <T x={32} y={y + 11} size={9}>
                Aparelhos conectados
              </T>
            ) : (
              <Bar x={32} y={y + 4} w={70} h={6} />
            )}
          </g>
        ))}
      </Phone>
      <Ring x={21} y={98} w={124} h={24} r={10} />
      <Badge x={21} y={98} n={1} />

      <Phone x={168} y={12} w={140} h={260}>
        <T x={65} y={42} size={10} anchor="middle">
          Aparelhos conectados
        </T>
        <rect x={40} y={60} width={50} height={32} rx={4} fill="none" stroke="#c9c6d6" strokeWidth={3} />
        <rect x={32} y={94} width={66} height={5} rx={2.5} fill="#c9c6d6" />
        <rect x={12} y={114} width={106} height={26} rx={13} fill={WA} />
        <T x={65} y={131} size={9} anchor="middle" fill="#ffffff">
          Conectar um aparelho
        </T>
      </Phone>
      <Ring x={181} y={127} w={114} h={34} r={17} />
      <Badge x={181} y={127} n={2} />

      <Arrow x1={150} y1={110} x2={178} y2={140} bend={-8} />
    </Art>
  );
}

/** Passo 3: na câmera, "Conectar com número de telefone" e digitar o código. */
function EnterCode({ code }: { code: string }) {
  const chars = (code || "")
    .replace(/[^0-9A-Za-z]/g, "")
    .slice(0, 8)
    .padEnd(8, "•")
    .split("");
  return (
    <Art>
      <Phone x={20} y={-100} screen="#1f1d29">
        <path
          d="M35 150 V138 a8 8 0 0 1 8 -8 H55 M105 130 H117 a8 8 0 0 1 8 8 V150 M125 200 V212 a8 8 0 0 1 -8 8 H105 M55 220 H43 a8 8 0 0 1 -8 -8 V200"
          stroke="#ffffff"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <T x={80} y={256} size={8.5} anchor="middle" fill="#ffffff">
          Conectar com número
        </T>
        <T x={80} y={268} size={8.5} anchor="middle" fill="#ffffff">
          de telefone
        </T>
      </Phone>
      <Ring x={34} y={143} w={142} h={34} r={12} />

      {chars.map((c, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 204 + col * 27;
        const y = 54 + row * 38;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={23}
              height={30}
              rx={7}
              fill="#ffffff"
              stroke="color-mix(in srgb, var(--primary) 45%, white)"
              strokeWidth={1.5}
            />
            <T x={x + 11.5} y={y + 21} size={15} anchor="middle" fill="var(--primary-text)">
              {c}
            </T>
          </g>
        );
      })}
      <T x={256} y={40} size={11} anchor="middle" fill="var(--muted)" weight={700}>
        Digite o código
      </T>
      <Arrow x1={178} y1={150} x2={214} y2={132} bend={14} />
    </Art>
  );
}

/** Passos de conexão por código (o mesmo texto de antes, agora com desenho). */
export function pairingSteps(code: string): GuideStep[] {
  return [
    {
      art: <OpenSettings />,
      text: (
        <>
          Abra o WhatsApp deste número e toque em <b>Configurações</b> (no Android, toque em <b>⋮</b> no alto).
        </>
      ),
    },
    {
      art: <LinkedDevices />,
      text: (
        <>
          Toque em <b>Aparelhos conectados</b> (no Android, <b>Dispositivos conectados</b>) e depois em{" "}
          <b>Conectar um aparelho</b>.
        </>
      ),
    },
    {
      art: <EnterCode code={code} />,
      text: (
        <>
          Na câmera, toque em <b>Conectar com número de telefone</b> e digite o código. Se estiver em outro aparelho,
          também dá para escanear o QR code.
        </>
      ),
    },
  ];
}
