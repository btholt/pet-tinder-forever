import { AppLayout } from "@/components/AppLayout";

export function Matches() {
  return (
    <AppLayout>
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading your matches…</p>
      </div>
    </AppLayout>
  );
}
