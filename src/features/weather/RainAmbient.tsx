/**
 * Chuva de ambiente: fios finos caindo atrás do conteúdo, só enquanto chove de verdade.
 * Só CSS (transform), sem JS por quadro; some com "reduzir movimento". Fica fora dos toques.
 */
const DROPS = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  delay: `${-((i * 53) % 18) / 10}s`,
  duration: `${0.9 + ((i * 29) % 7) / 10}s`,
  height: 14 + ((i * 17) % 14),
}));

export function RainAmbient() {
  return (
    <div data-testid="rain-ambient" aria-hidden className="rain-ambient">
      {DROPS.map((d, i) => (
        <i key={i} style={{ left: d.left, height: d.height, animationDelay: d.delay, animationDuration: d.duration }} />
      ))}
    </div>
  );
}
