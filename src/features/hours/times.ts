/** 06:00 a 23:00 de meia em meia hora (mesma faixa da grade do dia). */
export const HOUR_OPTIONS = Array.from({ length: 35 }, (_, i) => {
  const m = 6 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`;
});
