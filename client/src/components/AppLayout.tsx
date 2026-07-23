import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-paper">
      <AppHeader />
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
