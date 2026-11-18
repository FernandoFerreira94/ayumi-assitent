// O Mascot importa CSS (acessórios de estação). Fora do Next o Node não sabe carregar .css: aqui vira módulo vazio.
// Precisa ser o PRIMEIRO import do script, antes de qualquer componente.
const extensions = (require as unknown as { extensions: Record<string, (m: unknown) => void> }).extensions;
extensions[".css"] = () => {};
