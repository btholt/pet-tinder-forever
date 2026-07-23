import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { Pet, SwipeDirection } from "@shared/types";
import { api, ApiError } from "@/lib/api";
import { PetCard } from "@/components/PetCard";
import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const REFETCH_THRESHOLD = 5;
const FETCH_LIMIT = 20;

interface LastSwipe {
  pet: Pet;
  direction: SwipeDirection;
}

export function SwipeDeck({ onMatch }: { onMatch: (pet: Pet) => void }) {
  const [queue, setQueue] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lastSwipe, setLastSwipe] = useState<LastSwipe | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  const swipedIds = useRef<Set<number>>(new Set());
  const fetchingMore = useRef(false);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Initial fetch on mount. The fetch itself is declared and invoked inside
  // the effect (rather than through a shared useCallback) so the effect body
  // only ever synchronizes with the external API — no hoisted function that
  // resolves to a setState call gets invoked directly from effect scope.
  useEffect(() => {
    let cancelled = false;
    async function fetchInitialQueue() {
      setLoading(true);
      setError(null);
      try {
        const pets = await api.petsQueue(FETCH_LIMIT);
        if (cancelled) return;
        setQueue(pets.filter((p) => !swipedIds.current.has(p.id)));
      } catch {
        if (!cancelled) {
          setError("Couldn't load pets. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchInitialQueue();
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  // Refetch when fewer than REFETCH_THRESHOLD cards remain.
  useEffect(() => {
    if (loading || queue.length === 0 || queue.length >= REFETCH_THRESHOLD) {
      return;
    }
    if (fetchingMore.current) return;
    fetchingMore.current = true;
    let cancelled = false;
    async function fetchMoreQueue() {
      try {
        const pets = await api.petsQueue(FETCH_LIMIT);
        if (cancelled) return;
        setQueue((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const fresh = pets.filter(
            (p) => !existingIds.has(p.id) && !swipedIds.current.has(p.id)
          );
          return [...prev, ...fresh];
        });
      } catch {
        // Silent background refetch failure — the user can keep swiping
        // through whatever remains; the threshold effect will retry once
        // the queue length changes again.
      } finally {
        fetchingMore.current = false;
      }
    }
    fetchMoreQueue();
    return () => {
      cancelled = true;
    };
  }, [queue.length, loading]);

  // Preload the next two cards' primary photo so they never pop in blank.
  useEffect(() => {
    for (const pet of queue.slice(1, 3)) {
      const img = new Image();
      img.src = pet.photos[0];
    }
  }, [queue]);

  // Reset the photo carousel whenever the top pet changes. Adjusted during
  // render (not in an effect) per the React-documented pattern for resetting
  // state when a prop/derived value changes.
  const topPet = queue[0] ?? null;
  const [carouselForId, setCarouselForId] = useState<number | null>(null);
  if (topPet && topPet.id !== carouselForId) {
    setCarouselForId(topPet.id);
    setPhotoIndex(0);
  }

  const commitSwipe = useCallback(
    (direction: SwipeDirection) => {
      const pet = queue[0];
      if (!pet) return;

      swipedIds.current.add(pet.id);
      setQueue((prev) => prev.slice(1));
      setLastSwipe({ pet, direction });
      setAnnouncement(direction === "like" ? `Adopted ${pet.name}` : `Passed on ${pet.name}`);

      if (direction === "like") onMatch(pet);

      api.swipe(pet.id, direction).catch(() => {
        toast.error(`Couldn't save your swipe on ${pet.name}. Added it back to the deck.`);
        swipedIds.current.delete(pet.id);
        setQueue((prev) => [...prev, pet]);
      });
    },
    [queue, onMatch]
  );

  const gesture = useSwipeGesture({
    onCommit: (direction) => {
      gesture.flyOff(direction, reducedMotion);
      window.setTimeout(() => commitSwipe(direction), reducedMotion ? 0 : 350);
    },
    disabled: false,
  });

  const handleUndo = useCallback(async () => {
    if (!lastSwipe) return;
    const { pet } = lastSwipe;
    setLastSwipe(null);
    swipedIds.current.delete(pet.id);
    setQueue((prev) => [pet, ...prev]);
    setAnnouncement(`Undid swipe on ${pet.name}`);

    try {
      await api.undoSwipe(pet.id);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Couldn't undo that swipe.";
      toast.error(message);
    }
  }, [lastSwipe]);

  const handleTapZone = useCallback(
    (zone: "left" | "right") => {
      const pet = queue[0];
      if (!pet) return;
      setPhotoIndex((i) => {
        if (zone === "right") return Math.min(i + 1, pet.photos.length - 1);
        return Math.max(i - 1, 0);
      });
    },
    [queue]
  );

  useEffect(() => {
    deckRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const pet = queue[0];
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        if (pet) {
          gesture.flyOff("pass", reducedMotion);
          window.setTimeout(() => commitSwipe("pass"), reducedMotion ? 0 : 350);
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (pet) {
          gesture.flyOff("like", reducedMotion);
          window.setTimeout(() => commitSwipe("like"), reducedMotion ? 0 : 350);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        handleTapZone("right");
        break;
      case "ArrowDown":
        e.preventDefault();
        handleTapZone("left");
        break;
      case "Backspace":
        e.preventDefault();
        handleUndo();
        break;
    }
  }

  const visible = useMemo(() => queue.slice(0, 3), [queue]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="h-[70vh] w-full max-w-[380px] animate-pulse rounded-[28px] bg-ink/10 sm:h-[620px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-base text-muted-foreground">{error}</p>
        <Button onClick={() => setRetryToken((n) => n + 1)}>Try again</Button>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">
          That's everyone for now.
        </h2>
        <p className="max-w-sm text-muted-foreground">
          Check back soon, or go visit your matches.
        </p>
        <Button asChild className="bg-gradient-to-r from-berry to-mango text-paper">
          <Link to="/matches">See matches</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={deckRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex h-full flex-col items-center justify-center gap-2 outline-none"
      aria-label="Pet swipe deck. Use arrow keys or the buttons below to pass or adopt."
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 45%, rgb(255 61 104 / 0.12), rgb(255 158 68 / 0.08) 55%, transparent 80%)",
        }}
      />

      <div className="relative w-full max-w-[380px] flex-1 sm:h-[620px] sm:flex-none">
        {visible.map((pet, i) => {
          const isTop = i === 0;
          const isSecond = i === 1;
          const baseTransform =
            i === 0
              ? undefined
              : i === 1
                ? "scale(0.95) translateY(10px)"
                : "scale(0.9) translateY(20px)";

          return (
            <PetCard
              key={pet.id}
              pet={pet}
              photoIndex={isTop ? photoIndex : 0}
              interactive={isTop}
              ariaHidden={!isTop}
              style={
                isTop
                  ? { zIndex: 3 }
                  : { transform: baseTransform, zIndex: 3 - i, transition: "transform 300ms" }
              }
              cardRef={isTop ? gesture.cardRef : isSecond ? gesture.nextCardRef : undefined}
              adoptStampRef={isTop ? gesture.adoptStampRef : undefined}
              nopeStampRef={isTop ? gesture.nopeStampRef : undefined}
              onPointerDown={isTop ? gesture.onPointerDown : undefined}
              onPointerMove={isTop ? gesture.onPointerMove : undefined}
              onPointerUp={isTop ? gesture.onPointerUp : undefined}
              onPointerCancel={isTop ? gesture.onPointerCancel : undefined}
              onTapZone={isTop ? handleTapZone : undefined}
            />
          );
        })}
      </div>

      <ActionBar
        onPass={() => {
          gesture.flyOff("pass", reducedMotion);
          window.setTimeout(() => commitSwipe("pass"), reducedMotion ? 0 : 350);
        }}
        onAdopt={() => {
          gesture.flyOff("like", reducedMotion);
          window.setTimeout(() => commitSwipe("like"), reducedMotion ? 0 : 350);
        }}
        onUndo={handleUndo}
        undoDisabled={!lastSwipe}
      />

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
