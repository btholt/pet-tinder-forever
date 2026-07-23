import { useCallback, useRef } from "react";

export type SwipeGestureDirection = "like" | "pass";

interface UseSwipeGestureOptions {
  /** Called once a drag crosses the commit threshold or is flicked hard enough. */
  onCommit: (direction: SwipeGestureDirection) => void;
  /** Disables the physics (used under prefers-reduced-motion); tap zones still work. */
  disabled?: boolean;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastT: number;
  velocityX: number;
  moved: boolean;
}

const ROTATION_FACTOR = 18;
const COMMIT_DISTANCE_RATIO = 0.32;
const COMMIT_VELOCITY = 0.45; // px/ms
const STAMP_FADE_RATIO = 0.35;
const SPRING_EASING = "cubic-bezier(0.18, 0.89, 0.32, 1.28)";
const TAP_MOVE_THRESHOLD = 6;

/**
 * One Pointer-Events-based drag implementation shared by mouse and touch.
 * Transforms are driven imperatively via refs inside requestAnimationFrame;
 * React state is only touched on commit (via onCommit). See CLAUDE.md §8.
 */
export function useSwipeGesture({ onCommit, disabled }: UseSwipeGestureOptions) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const adoptStampRef = useRef<HTMLDivElement | null>(null);
  const nopeStampRef = useRef<HTMLDivElement | null>(null);
  const nextCardRef = useRef<HTMLDivElement | null>(null);

  const dragState = useRef<DragState | null>(null);
  const rafId = useRef<number | null>(null);
  const pendingDx = useRef(0);
  const pendingDy = useRef(0);
  const wasTapRef = useRef(true);

  const applyTransform = useCallback((dx: number, dy: number) => {
    const card = cardRef.current;
    if (!card) return;
    const width = card.offsetWidth || 1;
    const theta = clamp((dx / width) * ROTATION_FACTOR, -ROTATION_FACTOR, ROTATION_FACTOR);
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${theta}deg)`;

    const adopt = adoptStampRef.current;
    const nope = nopeStampRef.current;
    if (adopt) {
      adopt.style.opacity = String(clamp(dx / (STAMP_FADE_RATIO * width), 0, 1));
    }
    if (nope) {
      nope.style.opacity = String(clamp(-dx / (STAMP_FADE_RATIO * width), 0, 1));
    }

    const next = nextCardRef.current;
    if (next) {
      const dragRatio = clamp(Math.abs(dx) / (COMMIT_DISTANCE_RATIO * width), 0, 1);
      const scale = 0.95 + 0.05 * dragRatio;
      next.style.transform = `scale(${scale})`;
    }
  }, []);

  const scheduleFrame = useCallback(() => {
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      applyTransform(pendingDx.current, pendingDy.current);
    });
  }, [applyTransform]);

  const resetCardStyle = useCallback((immediate: boolean) => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = immediate ? "none" : `transform 300ms ${SPRING_EASING}`;
    card.style.transform = "translate(0px, 0px) rotate(0deg)";
    const adopt = adoptStampRef.current;
    const nope = nopeStampRef.current;
    if (adopt) adopt.style.opacity = "0";
    if (nope) nope.style.opacity = "0";
    const next = nextCardRef.current;
    if (next) {
      next.style.transition = immediate ? "none" : "transform 300ms " + SPRING_EASING;
      next.style.transform = "scale(0.95)";
    }
  }, []);

  const flyOff = useCallback(
    (direction: SwipeGestureDirection, reducedMotion: boolean) => {
      const card = cardRef.current;
      if (!card) return;
      const width = card.offsetWidth || 320;
      const targetX = direction === "like" ? width * 1.6 : -width * 1.6;
      const targetRotate = direction === "like" ? 24 : -24;
      card.style.transition = reducedMotion ? "opacity 120ms linear" : "transform 350ms ease-out, opacity 350ms ease-out";
      card.style.transform = reducedMotion
        ? "translate(0, 0) rotate(0deg)"
        : `translate(${targetX}px, -40px) rotate(${targetRotate}deg)`;
      card.style.opacity = "0";
    },
    []
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      const card = cardRef.current;
      if (!card) return;
      card.setPointerCapture(e.pointerId);
      card.style.transition = "none";
      dragState.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        lastT: e.timeStamp,
        velocityX: 0,
        moved: false,
      };
    },
    [disabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dx) > TAP_MOVE_THRESHOLD || Math.abs(dy) > TAP_MOVE_THRESHOLD) {
        drag.moved = true;
      }

      const dt = e.timeStamp - drag.lastT;
      if (dt > 0) {
        drag.velocityX = (e.clientX - drag.lastX) / dt;
      }
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.lastT = e.timeStamp;

      pendingDx.current = dx;
      pendingDy.current = dy * 0.4; // subtle vertical follow, mostly horizontal
      scheduleFrame();
    },
    [scheduleFrame]
  );

  const finishDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      dragState.current = null;

      const card = cardRef.current;
      card?.releasePointerCapture(e.pointerId);

      const width = card?.offsetWidth || 1;
      const dx = e.clientX - drag.startX;
      const commitByDistance = Math.abs(dx) > COMMIT_DISTANCE_RATIO * width;
      const commitByVelocity = Math.abs(drag.velocityX) > COMMIT_VELOCITY;

      if (commitByDistance || commitByVelocity) {
        const direction: SwipeGestureDirection = dx > 0 ? "like" : "pass";
        onCommit(direction);
      } else {
        resetCardStyle(false);
      }

      wasTapRef.current = !drag.moved;
      return drag.moved;
    },
    [onCommit, resetCardStyle]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      finishDrag(e);
    },
    [finishDrag]
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragState.current;
      dragState.current = null;
      if (drag) {
        cardRef.current?.releasePointerCapture(e.pointerId);
        resetCardStyle(false);
      }
    },
    [resetCardStyle]
  );

  return {
    cardRef,
    adoptStampRef,
    nopeStampRef,
    nextCardRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    flyOff,
    resetCardStyle,
    dragState,
    wasTapRef,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
