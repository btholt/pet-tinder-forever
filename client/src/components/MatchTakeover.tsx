import { useEffect } from "react";
import type { Pet } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const AUTO_DISMISS_MS = 2200;

interface MatchTakeoverProps {
  pet: Pet | null;
  onKeepSwiping: () => void;
  onSeeMatches: () => void;
}

/**
 * Full-bleed celebration overlay shown on every right-swipe. Auto-dismisses
 * after 2.2s or on any tap. Under prefers-reduced-motion it becomes a plain,
 * instant cross-fade with confetti suppressed.
 */
export function MatchTakeover({ pet, onKeepSwiping, onSeeMatches }: MatchTakeoverProps) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!pet) return;
    const timer = window.setTimeout(onKeepSwiping, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [pet, onKeepSwiping]);

  if (!pet) return null;

  return (
    <div
      key={pet.id}
      role="dialog"
      aria-modal="true"
      aria-label={`It's a match with ${pet.name}`}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 text-center ${
        reducedMotion ? "" : "animate-[match-pop_250ms_ease-out]"
      }`}
      onClick={onKeepSwiping}
    >
      <img
        src={pet.photos[0]}
        alt=""
        className="absolute inset-0 size-full scale-110 object-cover"
      />
      <div className="absolute inset-0 bg-grape/80" />
      {!reducedMotion && <Confetti />}

      <div className="relative z-10 flex flex-col items-center gap-3">
        <h1 className="bg-gradient-to-r from-berry via-mango to-sun bg-clip-text font-display text-5xl font-bold text-transparent">
          It's a match!
        </h1>
        <p className="font-display text-2xl font-semibold text-paper">
          {pet.name}
        </p>
      </div>

      <div className="relative z-10 flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onKeepSwiping();
          }}
          className="bg-gradient-to-r from-berry to-mango text-paper hover:opacity-90"
        >
          Keep swiping
        </Button>
        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onSeeMatches();
          }}
          className="text-paper hover:bg-white/10 hover:text-paper"
        >
          See matches
        </Button>
      </div>
    </div>
  );
}
