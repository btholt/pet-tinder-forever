import { useState } from "react";

const COLORS = ["bg-berry", "bg-mango", "bg-sun", "bg-mint"];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
}

/**
 * Hand-rolled CSS confetti burst — no canvas, no dependency. Suppressed
 * entirely under prefers-reduced-motion (see the .confetti-piece rule in
 * index.css).
 */
export function Confetti({ count = 36 }: { count?: number }) {
  // Lazy useState initializer: runs exactly once per mount, so the
  // randomness here doesn't violate the render-purity rule the way a
  // useMemo (re-)computation would.
  const [pieces] = useState<Piece[]>(() =>
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 1.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`confetti-piece absolute top-0 rounded-sm ${p.color}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
