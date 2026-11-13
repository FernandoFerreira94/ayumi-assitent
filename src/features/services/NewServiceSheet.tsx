"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import type { CatalogService } from "./catalog";
import { ServiceForm } from "./ServiceForm";

/**
 * "+ Serviço" fora da tela de Serviços (Vagas): abre o mesmo formulário numa folha por cima, sem trocar de tela.
 * Ao salvar a folha fecha e a tela atualiza sozinha (a action revalida Vagas).
 */
export function NewServiceSheet({
  services,
  label = "+ Serviço",
}: {
  services: Pick<CatalogService, "id" | "name">[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <Drawer.Root
      repositionInputs={false}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        // Formulário limpo a cada abertura
        if (o) setKey((k) => k + 1);
      }}
    >
      <Drawer.Trigger className="btn-tint inline-flex min-h-11 shrink-0 items-center rounded-full px-5 text-sm font-bold">
        {label}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[min(86dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] overflow-y-auto rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none">
          <Drawer.Handle className="mb-3" />
          <Drawer.Title className="pb-1 text-xl font-bold">Novo serviço</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            Preencha nome, duração e preço. Mudar depois vale só para os próximos agendamentos.
          </Drawer.Description>
          <ServiceForm
            key={key}
            services={services}
            onSaved={() => setOpen(false)}
            onDuplicate={() => undefined}
            onDelete={() => undefined}
          />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
