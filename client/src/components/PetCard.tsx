import type { CSSProperties, PointerEvent as ReactPointerEvent, Ref } from "react";
import type { Pet } from "@shared/types";
import { formatAge, speciesAccentClass } from "@/lib/format";

interface PetCardProps {
  pet: Pet;
  photoIndex: number;
  interactive: boolean;
  ariaHidden: boolean;
  style?: CSSProperties;
  onTapZone?: (zone: "left" | "right") => void;
  cardRef?: Ref<HTMLDivElement>;
  adoptStampRef?: Ref<HTMLDivElement>;
  nopeStampRef?: Ref<HTMLDivElement>;
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onTapClick?: () => void;
}

/**
 * A single card in the deck. Full-bleed photo, bottom scrim, name/age/breed
 * and trait chips over the scrim. Only the top card receives pointer
 * handlers and stamp refs; the two behind it render statically.
 */
export function PetCard({
  pet,
  photoIndex,
  interactive,
  ariaHidden,
  style,
  onTapZone,
  cardRef,
  adoptStampRef,
  nopeStampRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onTapClick,
}: PetCardProps) {
  const photo = pet.photos[photoIndex] ?? pet.photos[0];
  const locationLine = `${pet.breed} · ${pet.size} · ${pet.city}, ${pet.state}`;

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive || !onTapZone) return;
    onTapClick?.();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (ratio < 1 / 3) onTapZone("left");
    else if (ratio > 2 / 3) onTapZone("right");
  }

  return (
    <div
      ref={cardRef}
      role={interactive ? "group" : undefined}
      aria-hidden={ariaHidden || undefined}
      aria-label={interactive ? `${pet.name}, a ${pet.breed}` : undefined}
      tabIndex={-1}
      className="absolute inset-0 touch-none overflow-hidden rounded-[28px] bg-ink shadow-[0_18px_40px_-12px_rgb(33_18_58_/_0.35)]"
      style={style}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? onPointerUp : undefined}
      onPointerCancel={interactive ? onPointerCancel : undefined}
      onClick={handleClick}
    >
      {/* Segmented photo progress bar */}
      {pet.photos.length > 1 && (
        <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
          {pet.photos.map((url, i) => (
            <div
              key={url + i}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/35"
            >
              <div
                className="h-full rounded-full bg-white transition-[width] duration-150"
                style={{ width: i === photoIndex ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>
      )}

      <img
        src={photo}
        alt={`${pet.name}, a ${pet.breed}`}
        className="size-full object-cover"
        draggable={false}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "linear-gradient(to top, rgb(33 18 58 / 0.85) 0%, rgb(33 18 58 / 0.45) 30%, transparent 60%)",
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 text-paper">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display text-4xl font-semibold">{pet.name}</h2>
          <span className="text-base font-medium text-paper/85">
            {formatAge(pet.ageMonths)}
          </span>
        </div>
        <p className="text-base font-medium text-paper/90">{locationLine}</p>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${speciesAccentClass[pet.species]}`}
          >
            {pet.species}
          </span>
          {pet.traits.map((trait) => (
            <span
              key={trait}
              className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold tracking-wide text-paper uppercase backdrop-blur-sm"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      {interactive && (
        <>
          <div
            ref={adoptStampRef}
            className="pointer-events-none absolute top-10 left-6 rounded-xl border-4 border-mint px-3 py-1 text-3xl font-black tracking-wide text-mint opacity-0"
            style={{ transform: "rotate(-14deg)" }}
            aria-hidden
          >
            ADOPT
          </div>
          <div
            ref={nopeStampRef}
            className="pointer-events-none absolute top-10 right-6 rounded-xl border-4 border-berry px-3 py-1 text-3xl font-black tracking-wide text-berry opacity-0"
            style={{ transform: "rotate(14deg)" }}
            aria-hidden
          >
            NOPE
          </div>
        </>
      )}
    </div>
  );
}
