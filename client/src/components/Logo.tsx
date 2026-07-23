import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The Pawmarks wordmark: a paw glyph in a brand-gradient badge next to the
 * name set in Fredoka. Used on the landing page, auth screens, and the
 * signed-in header.
 */
export function Logo({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-berry to-mango text-paper shadow-md">
        <PawPrint className="size-5" strokeWidth={2.5} />
      </span>
      <span
        className={cn(
          "font-display text-xl font-semibold",
          variant === "light" ? "text-paper" : "text-ink"
        )}
      >
        Pawmarks
      </span>
    </div>
  );
}
