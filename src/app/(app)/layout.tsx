import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { Dock } from "@/components/nav/Dock";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <OfflineBanner />
      {children}
      <Dock />
    </>
  );
}
