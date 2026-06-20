import { motion, useReducedMotion } from "framer-motion";
import { EXPO_OUT } from "./easing";

/**
 * Splits a string into words and staggers each word in via a y/opacity reveal.
 * Used for the Hero headline and the Final CTA headline (intentional rhyme).
 *
 * Respects prefers-reduced-motion: falls back to an instant opacity-only show.
 */
export default function RevealText({
  text,
  as = "span",
  className = "",
  wordClassName = "",
  delay = 0,
  stagger = 0.06,
  duration = 0.7,
}) {
  const reduce = useReducedMotion();
  const words = String(text).split(" ");

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduce ? 0 : stagger,
        delayChildren: reduce ? 0 : delay,
      },
    },
  };

  const child = reduce
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.01 } },
      }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration, ease: EXPO_OUT } },
      };

  const MotionTag = motion[as] || motion.span;

  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
      aria-label={String(text)}
    >
      {words.map((word, i) => (
        <span key={i} aria-hidden="true">
          <span className="inline-block overflow-hidden align-bottom">
            <motion.span className={`inline-block ${wordClassName}`} variants={child}>
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </MotionTag>
  );
}
