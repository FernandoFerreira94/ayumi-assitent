import { SectionSkeleton } from "@/features/settings/SectionSkeleton";

export default function Loading() {
  return <SectionSkeleton label="Carregando mensagens" cards={2} />;
}
