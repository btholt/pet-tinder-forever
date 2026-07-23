/** Renders `age_months` as "2 yrs" or "8 mo" per CLAUDE.md §7. */
export function formatAge(ageMonths: number): string {
  if (ageMonths < 12) {
    return `${ageMonths} mo`;
  }
  const years = Math.floor(ageMonths / 12);
  return `${years} ${years === 1 ? "yr" : "yrs"}`;
}

/** Species accent color, expressed as Tailwind utility classes (no raw hex). */
export const speciesAccentClass: Record<string, string> = {
  dog: "bg-mango text-ink",
  cat: "bg-grape text-paper",
  bird: "bg-species-bird text-ink",
  rabbit: "bg-species-rabbit text-ink",
  reptile: "bg-mint text-ink",
};
