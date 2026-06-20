import { motion, useReducedMotion } from "framer-motion";
import FadeInWhenVisible from "@/components/motion/FadeInWhenVisible";
import CountUp from "@/components/motion/CountUp";
import { EXPO_OUT } from "@/components/motion/easing";

const MAX = 15;
const TIERS = [
  { label: "Launch Blocker", points: 15, color: "hsl(var(--destructive))" },
  { label: "Critical", points: 10, color: "hsl(var(--chart-3))" },
  { label: "High", points: 7, color: "hsl(var(--chart-4))" },
  { label: "Medium", points: 4, color: "hsl(var(--accent))" },
  { label: "Low", points: 1, color: "hsl(var(--chart-5))" },
  { label: "Duplicate", points: 0.5, color: "hsl(var(--muted-foreground))" },
];

export default function PointsSystemSection() {
  const reduce = useReducedMotion();

  return (
    <section id="points" className="py-24 bg-secondary/40">
      <div className="max-w-5xl mx-auto px-4">
        <FadeInWhenVisible className="max-w-2xl mb-12">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-accent mb-4">
            Scoring
          </p>
          <h2 className="font-display italic font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-foreground">
            Severity &amp; points.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every validated bug earns points based on how badly it would hurt the
            product. The worse the break, the more it's worth. Rejected bugs score 0 —
            duplicates still earn a small 0.5 for being thorough.
          </p>
        </FadeInWhenVisible>

        <div className="space-y-5">
          {TIERS.map((tier, i) => (
            <div key={tier.label} className="flex items-center gap-4">
              <div className="w-32 sm:w-40 shrink-0 text-right">
                <span className="font-heading font-semibold text-sm sm:text-base text-foreground">
                  {tier.label}
                </span>
              </div>
              <div className="flex-1 h-10 bg-card rounded-lg border border-border overflow-hidden">
                <motion.div
                  className="h-full rounded-lg flex items-center justify-end pr-3"
                  style={{ backgroundColor: tier.color }}
                  initial={{ width: reduce ? `${(tier.points / MAX) * 100}%` : "0%" }}
                  whileInView={{ width: `${(tier.points / MAX) * 100}%` }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={
                    reduce
                      ? { duration: 0.01 }
                      : { duration: 1, ease: EXPO_OUT, delay: i * 0.1 }
                  }
                >
                  <span className="font-heading font-bold text-white text-sm tabular-nums drop-shadow">
                    <CountUp
                      end={tier.points}
                      decimals={tier.points % 1 === 0 ? 0 : 1}
                      duration={1}
                    />
                    <span className="font-normal opacity-80"> pts</span>
                  </span>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
