/**
 * Telas de abertura do PWA no iPhone (apple-touch-startup-image): o iOS mostra a imagem que casa
 * com o aparelho enquanto o app carrega. É lavanda lisa, igual ao primeiro quadro do splash, para
 * a passagem para a animação não piscar. `pnpm icons` gera os arquivos; o layout publica a lista.
 */
const DEVICES = [
  [440, 956, 3], // 16 Pro Max
  [402, 874, 3], // 16 Pro
  [430, 932, 3], // 14/15 Pro Max, 15/16 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [390, 844, 3], // 12, 13, 14
  [375, 812, 3], // X, XS, 11 Pro
  [360, 780, 3], // 12/13 mini
  [414, 896, 2], // XR, 11
  [375, 667, 2], // SE, 8
] as const;

export const STARTUP_IMAGES = DEVICES.map(([w, h, dpr]) => ({
  url: `/splash/${w * dpr}x${h * dpr}.png`,
  width: w * dpr,
  height: h * dpr,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
}));
