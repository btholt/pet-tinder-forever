import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { Pet } from "@shared/types";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { formatAge } from "@/lib/format";

export function Matches() {
  const [matches, setMatches] = useState<Pet[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function fetchMatches() {
      setLoading(true);
      setError(null);
      try {
        const pets = await api.matches();
        if (!cancelled) setMatches(pets);
      } catch {
        if (!cancelled) {
          setError("Couldn't load your matches. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMatches();
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  async function handleUnadopt(pet: Pet) {
    setRemovingIds((prev) => new Set(prev).add(pet.id));
    setMatches((prev) => prev?.filter((p) => p.id !== pet.id) ?? prev);
    try {
      await api.undoSwipe(pet.id);
      toast.success(`${pet.name} is back in the queue.`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't un-adopt that pet.";
      toast.error(message);
      setMatches((prev) => (prev ? [pet, ...prev] : [pet]));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(pet.id);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-ink/10"
            />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-base text-muted-foreground">{error}</p>
          <Button onClick={() => setRetryToken((n) => n + 1)}>Try again</Button>
        </div>
      </AppLayout>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <AppLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">
            No matches yet
          </h1>
          <p className="max-w-sm text-muted-foreground">
            Start swiping to find pets who are waiting for a home like yours.
          </p>
          <Button asChild className="bg-gradient-to-r from-berry to-mango text-paper">
            <Link to="/swipe">Start swiping</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-6 md:grid-cols-3 lg:grid-cols-4">
        {matches.map((pet) => (
          <div
            key={pet.id}
            className={`group relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink shadow-[0_10px_28px_-14px_rgb(33_18_58_/_0.4)] transition-opacity ${
              removingIds.has(pet.id) ? "opacity-50" : ""
            }`}
          >
            <img
              src={pet.photos[0]}
              alt={`${pet.name}, a ${pet.breed}`}
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-3 pt-10">
              <p className="font-display text-lg font-semibold text-paper">
                {pet.name}
                <span className="ml-1.5 font-sans text-sm font-normal text-paper/80">
                  {formatAge(pet.ageMonths)}
                </span>
              </p>
              <p className="truncate text-xs text-paper/80">
                {pet.city}, {pet.state}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleUnadopt(pet)}
              disabled={removingIds.has(pet.id)}
              className="absolute right-2 top-2 rounded-full bg-ink/60 px-3 py-1 text-xs font-semibold text-paper backdrop-blur-sm transition hover:bg-ink/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper disabled:opacity-50"
            >
              Un-adopt
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
