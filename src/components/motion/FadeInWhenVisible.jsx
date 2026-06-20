import { motion, useReducedMotion } from "framer-motion";
import { EXPO_OUT } from "./easing";

/**
 * Generic viewport-triggered slide-up + fade wrapper.
 * The default section-enter animation used across the landing page.
 */
export default function FadeInWhenVisible({
  children,
  className = "",
  delay = 0,
  y = 24,
  duration = 0.7,
  amount = 0.3,
  as = "div",
  ...rest
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={
        reduce
          ? { duration: 0.01 }
          : { duration, ease: EXPO_OUT, delay }
      }
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
