"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { openNewAppointment } from "@/features/appointments/QuickBook";

const icon = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
    {d}
  </svg>
);

/** Da esquerda para a direita no semicírculo; "Novo" fica no topo, ao alcance do polegar, e abre a folha sem sair da tela. */
const ITEMS = [
  { href: "/agenda", label: "Agenda", icon: icon(<><rect x="3.5" y="5" width="17" height="15" rx="4.5" /><path d="M8 3v3.5M16 3v3.5M3.5 10h17" /></>) },
  { href: "/clientes", label: "Clientes", icon: icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>) },
  { href: null, label: "Novo", icon: icon(<path d="M12 5v14M5 12h14" />) },
  { href: "/vagas", label: "Vagas", icon: icon(<path d="M12 3.5 13.6 10.4 20.5 12 13.6 13.6 12 20.5 10.4 13.6 3.5 12 10.4 10.4Z" />) },
  { href: "/ajustes", label: "Ajustes", icon: icon(<><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2.5" /><circle cx="15" cy="17" r="2.5" /></>) },
];
/** Raio do semicírculo: 104px deixa ~82px entre os centros, folga para os rótulos não encostarem. */
const RADIUS = 104;

/** Nav em leque: um botão central que vira × e abre as telas em semicírculo por cima de um fundo desfocado. */
export function FanNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="fan-backdrop" data-open={open || undefined} onClick={() => setOpen(false)} aria-hidden="true" />
      <nav className="fan" aria-label="Navegação" data-open={open || undefined}>
        {/* inert fechado: os itens escondidos não recebem foco nem são lidos */}
        <ul id="fan-items" inert={!open}>
          {ITEMS.map((item, i) => {
            const angle = Math.PI - (i * Math.PI) / (ITEMS.length - 1);
            const active = item.href !== null && (pathname === item.href || pathname.startsWith(`${item.href}/`));
            return (
              <li
                key={item.label}
                className="fan-item"
                style={{
                  ["--x" as string]: `${Math.cos(angle) * RADIUS}px`,
                  ["--y" as string]: `${-Math.sin(angle) * RADIUS}px`,
                  ["--d" as string]: `${i * 35}ms`,
                }}
              >
                {item.href === null ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      openNewAppointment();
                    }}
                    className="fan-link"
                  >
                    {item.icon}
                    <span className="fan-label">{item.label}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className="fan-link"
                  >
                    {item.icon}
                    <span className="fan-label">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="fab fan-toggle"
          aria-expanded={open}
          aria-controls="fan-items"
          aria-label={open ? "Fechar navegação" : "Abrir navegação"}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </nav>
    </>
  );
}
