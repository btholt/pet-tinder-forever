import { Heart, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  onPass: () => void;
  onAdopt: () => void;
  onUndo: () => void;
  undoDisabled: boolean;
  disabled?: boolean;
}

/**
 * Circular Pass / Undo / Adopt buttons floating over the card's bottom edge.
 * Fully keyboard operable with visible focus rings; scale 1.12 on hover,
 * 0.94 on press.
 */
export function ActionBar({
  onPass,
  onAdopt,
  onUndo,
  undoDisabled,
  disabled,
}: ActionBarProps) {
  return (
    <div className="relative z-20 flex items-center justify-center gap-6 pt-2 pb-6">
      <CircleButton
        label="Pass"
        onClick={onPass}
        disabled={disabled}
        className="size-14 text-berry"
      >
        <X className="size-6" strokeWidth={2.5} />
      </CircleButton>

      <CircleButton
        label="Undo last swipe"
        onClick={onUndo}
        disabled={disabled || undoDisabled}
        className="size-10 text-sun"
      >
        <Undo2 className="size-4" strokeWidth={2.5} />
      </CircleButton>

      <CircleButton
        label="Adopt"
        onClick={onAdopt}
        disabled={disabled}
        className="size-14 text-mint"
      >
        <Heart className="size-6" strokeWidth={2.5} fill="currentColor" />
      </CircleButton>
    </div>
  );
}

function CircleButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-full bg-white shadow-lg outline-none transition-transform duration-150",
        "hover:scale-[1.12] active:scale-[0.94]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}
