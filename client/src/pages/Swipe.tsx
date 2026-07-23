import { AppLayout } from "@/components/AppLayout";

export function Swipe() {
  return (
    <AppLayout>
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading the deck…</p>
      </div>
    </AppLayout>
  );
}
