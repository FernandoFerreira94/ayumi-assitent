"use client";

import { useState } from "react";
import { ClientCardBody, DeleteSheet, EditSheet, type Client } from "./ClientRow";

/**
 * Ficha fixa da cliente no desktop (coluna de 420 px ao lado da lista).
 * O conteúdo é o mesmo da folha do celular; a cliente vem do ?id= que a página leu no servidor.
 */
export function ClientPanel({ client }: { client: Client | null }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <aside
      aria-label="Ficha da cliente"
      className="glass sticky top-6 hidden max-h-[calc(100dvh-48px)] overflow-y-auto rounded-3xl p-5 lg:block"
    >
      {client ? (
        <>
          <h2 className="text-xl font-bold">{client.name}</h2>
          <p className="pb-4 text-sm font-semibold text-muted">
            {client.phone}
            {client.email ? ` · ${client.email}` : ""}
          </p>
          <ClientCardBody client={client} onEdit={() => setEditing(true)} onDelete={() => setDeleting(true)} />
          {/* key: trocar de cliente reinicia o formulário com os dados dela */}
          <EditSheet key={client.id} client={client} open={editing} onOpenChange={setEditing} />
          <DeleteSheet client={client} open={deleting} onOpenChange={setDeleting} />
        </>
      ) : (
        <div className="grid min-h-64 place-content-center gap-1 text-center">
          <p className="font-bold">Escolha uma cliente na lista</p>
          <p className="text-sm font-semibold text-muted">Use J e K para passar de uma para outra.</p>
        </div>
      )}
    </aside>
  );
}
