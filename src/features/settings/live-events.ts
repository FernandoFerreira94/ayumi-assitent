/**
 * Avisos entre cartões e o resumo de Conexões na mesma tela: o interruptor muda, o selo acompanha sem recarregar.
 * Push e localização vivem no aparelho/cliente; por isso evento de janela em vez de revalidar o servidor.
 */
export const PUSH_CHANGED = "bubbly:push-changed";
export const LOCATION_CHANGED = "bubbly:location-changed";

export function emitPushChanged() {
  window.dispatchEvent(new Event(PUSH_CHANGED));
}

export function emitLocationChanged(on: boolean) {
  window.dispatchEvent(new CustomEvent<boolean>(LOCATION_CHANGED, { detail: on }));
}
