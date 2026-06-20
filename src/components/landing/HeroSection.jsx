import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, ArrowRight, Trophy } from "lucide-react";
import { entities } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import RevealText from "@/components/motion/RevealText";
import { EXPO_OUT } from "@/components/motion/easing";

// 3D scene is isolated + lazy so it never blocks text/CTAs from being interactive.
const HeroScene = lazy(() => import("@/three/HeroScene"));

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

function Chip({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 bg-primary/5 border border-border rounded-full px-3 py-1 text-sm text-foreground/80 backdrop-blur-sm">
      <Icon className="w-3.5 h-3.5 text-accent" />
      {children}
    </div>
  );
}

export default function HeroSection() {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();

  const { data: settings } = useQuery({
    queryKey: ["eventSettings"],
    queryFn: async () => {
      const list = await entities.EventSettings.list();
      return list[0] || {};
    },
    staleTime: 60000,
  });

  return (
    <section id="top" className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* 3D branch + bug — mobile gets a CSS-only warm glow instead of a Canvas */}
      <div className="absolute inset-0">
        {isMobile ? (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(33,66,110,0.10),transparent_60%)]" />
        ) : (
          <Suspense fallback={<div className="absolute inset-0" />}>
            <HeroScene />
          </Suspense>
        )}
        {/* soft left-to-right wash so the headline keeps contrast over the scene */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>

      {/* Foreground text in a fixed DOM layer (not in canvas) — crisp + accessible */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full pt-24 pb-16">
        <div className="max-w-3xl">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EXPO_OUT }}
            className="inline-flex items-center gap-2 bg-primary/5 border border-border rounded-full px-3 py-1 text-xs font-heading font-medium text-foreground/80 mb-6 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            A live bug bounty on a real product
          </motion.div>

          <RevealText
            text="Hunt. Score. Win."
            as="h1"
            className="font-display italic font-bold text-foreground text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight"
            delay={0.4}
            stagger={0.08}
          />

          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EXPO_OUT, delay: reduce ? 0 : 1.0 }}
            className="mt-6 text-lg text-muted-foreground font-body max-w-2xl leading-relaxed"
          >
            Genda Phool is opening up its production apps — Customer App, Delivery,
            Payments, Wallet, and more — for one live hunt. Find real bugs, earn real
            points, climb the leaderboard.
          </motion.p>

          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EXPO_OUT, delay: reduce ? 0 : 1.15 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/event-register">
              <Button size="lg" className="font-heading font-semibold gap-2 text-base h-12 px-7">
                Register — ₹149 <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button
                size="lg"
                variant="outline"
                className="font-heading font-semibold gap-2 text-base h-12 px-7"
              >
                <Trophy className="w-4 h-4" /> View Leaderboard
              </Button>
            </Link>
          </motion.div>

          {/* Live event chips — bound to EventSettings so they never go stale */}
          {(settings?.event_date || settings?.event_time || settings?.venue) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: reduce ? 0 : 1.35 }}
              className="mt-8 flex flex-wrap gap-2"
            >
              {settings?.event_date && <Chip icon={Calendar}>{settings.event_date}</Chip>}
              {settings?.event_time && <Chip icon={Clock}>{settings.event_time}</Chip>}
              {settings?.venue && <Chip icon={MapPin}>{settings.venue}</Chip>}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
