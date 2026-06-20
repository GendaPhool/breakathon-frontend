import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Medal, Trophy, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import FadeInWhenVisible from "@/components/motion/FadeInWhenVisible";
import { EXPO_OUT } from "@/components/motion/easing";

// Stylized preview using sample names — mirrors the real Leaderboard.jsx podium.
const PODIUM = [
  { rank: 2, name: "Ananya", points: 41, height: "h-28", gradient: "from-slate-300 to-slate-400", icon: Medal, order: 0 },
  { rank: 1, name: "Rohan", points: 58, height: "h-36", gradient: "from-amber-400 to-yellow-500", icon: Crown, order: 1 },
  { rank: 3, name: "Kabir", points: 33, height: "h-24", gradient: "from-orange-300 to-orange-400", icon: Medal, order: 2 },
];

export default function LeaderboardPreviewSection() {
  const reduce = useReducedMotion();
  // Rank 1 rises first, then 2, then 3.
  const riseDelay = { 1: 0, 2: 0.18, 3: 0.36 };

  return (
    <section id="leaderboard" className="py-24">
      <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <FadeInWhenVisible>
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-accent mb-4">
            Live rankings
          </p>
          <h2 className="font-display italic font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-foreground">
            Climb the board, live.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Ranked by total points from every validated and duplicate bug. Ties are
            broken by who validated more reports. Top 3 take the podium.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-accent font-medium">
            <RefreshCw className="w-4 h-4" />
            The board refreshes every 60 seconds — while the event is live, so are you.
          </div>
          <div className="mt-8">
            <Link to="/leaderboard">
              <Button size="lg" className="font-heading font-semibold gap-2 h-12 px-7">
                <Trophy className="w-4 h-4" /> View Live Leaderboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </FadeInWhenVisible>

        <FadeInWhenVisible delay={0.1}>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" /> Leaderboard
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                Preview
              </span>
            </div>

            <div className="flex items-end justify-center gap-3 pt-10 pb-2">
              {PODIUM.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.rank} className="flex flex-col items-center" style={{ order: p.order }}>
                    <div className="relative mb-2">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30">
                        <span className="font-display font-bold text-lg">{p.name[0]}</span>
                      </div>
                      <div className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    </div>
                    <p className="font-semibold text-sm text-center truncate w-24">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.points} pts</p>
                    <motion.div
                      className={`w-24 ${p.height} bg-gradient-to-t ${p.gradient} rounded-t-xl mt-2 flex items-center justify-center origin-bottom`}
                      initial={{ scaleY: reduce ? 1 : 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={
                        reduce
                          ? { duration: 0.01 }
                          : { duration: 0.7, ease: EXPO_OUT, delay: riseDelay[p.rank] }
                      }
                    >
                      <span className="text-white font-display font-bold text-2xl">#{p.rank}</span>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeInWhenVisible>
      </div>
    </section>
  );
}
