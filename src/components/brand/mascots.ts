/**
 * Mascotes do Mimo (a Bolha é o padrão de todo mundo; login e ícone da tela de início são sempre dela):
 * cada um troca as cores do app (mascot-themes.css), o corpo da Bolha (MascotBodies.tsx) e a abertura.
 * O rosto é o mesmo em todos, então humores, reações e acessórios de data valem para os oito.
 * Prancha: "Temas do Mimo". Cada pessoa escolhe o seu em Meu perfil (memberships.mascot).
 */
export const MASCOTS = [
  { id: "bolha", name: "Bolha", tag: "Lavanda, o padrão do Mimo", primary: "#6D4AFF" },
  { id: "abobora", name: "Abóbora", tag: "Laranja e preto", primary: "#F26B1D" },
  { id: "mia", name: "Mia", tag: "Gatinha em menta", primary: "#0A7A67" },
  { id: "caramelo", name: "Caramelo", tag: "Vira-lata caramelo", primary: "#9C5714" },
  { id: "lulu", name: "Lulu", tag: "Coelhinha rosa", primary: "#C2346B" },
  { id: "pingo", name: "Pingo", tag: "Pinguim azul", primary: "#2563C9" },
  { id: "mel", name: "Mel", tag: "Ursinha cor de mel", primary: "#E3A51A" },
  { id: "bambu", name: "Bambu", tag: "Panda grafite", primary: "#2B2A33" },
] as const;

export type MascotKind = (typeof MASCOTS)[number]["id"];

export const DEFAULT_MASCOT: MascotKind = "bolha";

export const isMascotKind = (v: unknown): v is MascotKind => MASCOTS.some((m) => m.id === v);

/** Guardado no aparelho para o tema aparecer já na primeira pintura (antes de o servidor responder). */
export const MASCOT_STORAGE = "mimo-mascot";

/** Script do <head>: aplica o tema salvo no aparelho antes da primeira pintura. O login é sempre da Bolha. */
export const mascotGate = `try{var m=localStorage.getItem("${MASCOT_STORAGE}");if(location.pathname.indexOf("/login")!==0&&m&&/^[a-z]+$/.test(m)&&m!=="${DEFAULT_MASCOT}")document.documentElement.dataset.mascot=m}catch(e){}`;
