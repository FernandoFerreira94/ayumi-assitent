"use client";

import Link from "next/link";
import { useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { useWeather } from "@/components/brand/useWeather";
import { Wordmark } from "@/components/brand/Wordmark";
import { outfitFor } from "@/features/owner-notices/weather";

/**
 * Topo do menu lateral: o mascote escolhido (parado, piscando) + "bubbly" e, embaixo, o nome de quem está logado.
 * Sem nome, a linha some (nada de "Sem nome"). No trilho de ícones (768 a 1279 px) só o mascote aparece.
 * Passar o mouse ou tocar faz o mascote dar uma gelatina: o topo também é o atalho para o Painel.
 * A roupa acompanha o clima de agora no lugar do aparelho (a mesma do Painel).
 */
export function SideNavBrand({ href, label, subtitle }: { href: string; label: string; subtitle?: string | null }) {
  const [bounce, setBounce] = useState(0);
  const name = subtitle?.trim() || null;
  const weather = useWeather();
  return (
    <Link
      href={href}
      title={label}
      className="sidenav-brand"
      onMouseEnter={() => setBounce((n) => n + 1)}
      onFocus={() => setBounce((n) => n + 1)}
    >
      <span aria-hidden="true" key={bounce} className={`sidenav-mascot ${bounce ? "sidenav-mascot-pop" : ""}`}>
        <Mascot idle size={40} season={null} weather={weather ? outfitFor(weather.now) : undefined} />
      </span>
      <span className="sr-only xl:not-sr-only xl:grid xl:min-w-0 xl:gap-1">
        <Wordmark className="text-[22px]" />
        {name ? <span className="sidenav-person truncate">{name}</span> : null}
      </span>
      <span className="sr-only">{label}</span>
    </Link>
  );
}
