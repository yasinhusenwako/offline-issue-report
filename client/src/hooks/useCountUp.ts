import { useEffect, useState } from 'react';

export function useCountUp(target: number, durationMs: number = 220): number {
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    // If reduced motion is requested, render target immediately
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || target === 0) {
      setCurrent(target);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [target, durationMs]);

  return current;
}
