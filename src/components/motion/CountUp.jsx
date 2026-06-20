import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Animated number counter. Counts 0 -> `end` over `duration` once it scrolls
 * into view. IntersectionObserver-gated so it only fires once.
 *
 * Supports decimals (e.g. 0.5) via the `decimals` prop, plus prefix/suffix.
 */
export default function CountUp({
  end,
  duration = 1.2,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reduce) {
      setValue(end);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min((now - start) / (duration * 1000), 1);
            // expo-out for the numeric ramp too
            const eased = 1 - Math.pow(1 - t, 4);
            setValue(end * eased);
            if (t < 1) requestAnimationFrame(tick);
            else setValue(end);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [end, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
