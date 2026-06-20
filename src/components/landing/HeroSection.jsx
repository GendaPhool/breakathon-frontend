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
      {/* 3D branch + bug — mobile gets a CSS warm glow and an animated SVG fallback instead of a heavy Canvas */}
      <div className="absolute inset-0">
        {isMobile ? (
          <>
            {/* Top-right soft green/gold glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(90,160,106,0.16),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_95%_25%,rgba(255,168,0,0.08),transparent_45%)]" />
            {/* Top-left soft glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(90,160,106,0.08),transparent_45%)]" />
            {/* Center/bottom blue glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(33,66,110,0.08),transparent_60%)]" />

            {/* Hanging leaves twig at the top-left corner - frames the logo */}
            <div className="absolute left-0 top-0 w-36 h-36 opacity-30 pointer-events-none select-none z-0">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <style>{`
                  @keyframes top-left-leaves-sway {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(2.5deg) translateY(1px); }
                    100% { transform: rotate(0deg); }
                  }
                  .animated-top-left-leaves {
                    animation: top-left-leaves-sway 11s ease-in-out infinite;
                    transform-origin: 0% 0%;
                  }
                `}</style>
                <g className="animated-top-left-leaves">
                  <path d="M 0 0 Q 30 20 60 12" stroke="#6b4a2f" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 0 0 Q 30 20 60 12" stroke="#4a3220" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
                  <path d="M 40 14 C 48 3 60 15 50 25 C 40 25 36 20 40 14 Z" fill="#3f7d4e" />
                  <path d="M 25 12 C 32 4 42 14 34 20 C 28 20 25 16 25 12 Z" fill="#5aa06a" opacity="0.9" />
                  <path d="M 52 11 C 58 5 65 12 60 18 C 55 18 52 15 52 11 Z" fill="#ffa800" opacity="0.8" />
                </g>
              </svg>
            </div>

            {/* Hanging leaves twig at the top-right corner - enlarged & enriched */}
            <div className="absolute right-0 top-0 w-52 h-52 opacity-45 pointer-events-none select-none z-0">
              <svg className="w-full h-full" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <style>{`
                  @keyframes top-leaves-sway {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(-3deg) translateY(2px); }
                    100% { transform: rotate(0deg); }
                  }
                  @keyframes petal-drift-1 {
                    0% { transform: translate(120px, 10px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.85; }
                    90% { opacity: 0.85; }
                    100% { transform: translate(10px, 90px) rotate(360deg); opacity: 0; }
                  }
                  @keyframes petal-drift-2 {
                    0% { transform: translate(100px, 0px) rotate(0deg); opacity: 0; }
                    15% { opacity: 0.75; }
                    85% { opacity: 0.75; }
                    100% { transform: translate(-10px, 70px) rotate(-240deg); opacity: 0; }
                  }
                  .animated-top-leaves {
                    animation: top-leaves-sway 10s ease-in-out infinite;
                    transform-origin: 100% 0%;
                  }
                  .drifting-petal-1 {
                    animation: petal-drift-1 12s linear infinite;
                  }
                  .drifting-petal-2 {
                    animation: petal-drift-2 16s linear infinite;
                    animation-delay: 4s;
                  }
                `}</style>
                
                {/* Floating/Drifting Petals */}
                <g className="drifting-petal-1">
                  <path d="M 0 0 C -5 -10 -15 -5 -10 5 C -5 10 5 5 0 0 Z" fill="#ffa800" />
                </g>
                <g className="drifting-petal-2">
                  <path d="M 0 0 C -4 -8 -12 -4 -8 4 C -4 8 4 4 0 0 Z" fill="#cf2418" opacity="0.85" />
                </g>

                <g className="animated-top-leaves">
                  {/* Primary Twig */}
                  <path d="M 120 0 Q 90 35 45 20" stroke="#6b4a2f" strokeWidth="5.5" strokeLinecap="round" />
                  <path d="M 120 0 Q 90 35 45 20" stroke="#4a3220" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
                  
                  {/* Secondary split twig */}
                  <path d="M 95 12 Q 75 35 60 40" stroke="#6b4a2f" strokeWidth="3.5" strokeLinecap="round" />
                  
                  {/* Leaf 1 (large dark green) */}
                  <path d="M 65 24 C 50 10 30 25 45 40 C 58 40 68 32 65 24 Z" fill="#3f7d4e" />
                  {/* Leaf 2 (light green) */}
                  <path d="M 85 24 C 75 12 60 26 72 35 C 82 35 88 28 85 24 Z" fill="#5aa06a" opacity="0.95" />
                  
                  {/* Leaf 3 on secondary twig (light green) */}
                  <path d="M 60 40 C 48 32 40 45 52 50 C 60 50 64 45 60 40 Z" fill="#5aa06a" />
                  
                  {/* Leaf 4 near top right base (dark green) */}
                  <path d="M 105 10 C 95 0 85 10 92 18 C 98 18 102 14 105 10 Z" fill="#3f7d4e" opacity="0.8" />

                  {/* Hanging marigold petals */}
                  <path d="M 50 21 C 42 12 32 25 40 32 C 48 32 50 25 50 21 Z" fill="#ffa800" />
                  <path d="M 72 34 C 66 28 58 38 64 43 C 70 43 72 38 72 34 Z" fill="#ffa800" opacity="0.9" />
                </g>
              </svg>
            </div>

            {/* Bottom-right branch with ladybug */}
            <div className="absolute right-0 bottom-10 w-full max-w-[450px] opacity-35 pointer-events-none select-none">
              <svg className="w-full h-auto" viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <style>{`
                  @keyframes branch-sway {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(1deg); }
                    100% { transform: rotate(0deg); }
                  }
                  @keyframes bug-hover {
                    0% { transform: translate(240px, 160px) rotate(15deg) scale(0.9); }
                    50% { transform: translate(240px, 157px) rotate(16deg) scale(0.9); }
                    100% { transform: translate(240px, 160px) rotate(15deg) scale(0.9); }
                  }
                  @keyframes mote-float {
                    0% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
                    50% { transform: translateY(-15px) translateX(10px); opacity: 0.6; }
                    100% { transform: translateY(-30px) translateX(0px); opacity: 0.2; }
                  }
                  .animated-branch {
                    animation: branch-sway 12s ease-in-out infinite;
                    transform-origin: 0% 60%;
                  }
                  .animated-bug {
                    animation: bug-hover 6s ease-in-out infinite;
                    transform-origin: center;
                  }
                  .mote-1 { animation: mote-float 10s ease-in-out infinite; }
                  .mote-2 { animation: mote-float 14s ease-in-out infinite; animation-delay: 2s; }
                  .mote-3 { animation: mote-float 12s ease-in-out infinite; animation-delay: 5s; }
                `}</style>
                {/* Floating Motes */}
                <circle cx="120" cy="180" r="3" fill="#d8c9a8" className="mote-1" />
                <circle cx="340" cy="80" r="4.5" fill="#d8c9a8" className="mote-2" />
                <circle cx="420" cy="220" r="2.5" fill="#d8c9a8" className="mote-3" />

                {/* Curved branch & leaves */}
                <g className="animated-branch">
                  <path d="M -20 180 Q 180 120 320 220 T 520 190" stroke="#6b4a2f" strokeWidth="24" strokeLinecap="round" />
                  <path d="M -20 180 Q 180 120 320 220 T 520 190" stroke="#4a3220" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
                  
                  {/* Twig with leaves */}
                  <path d="M 350 205 Q 380 170 390 140" stroke="#6b4a2f" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 390 140 C 370 120 360 90 400 80 C 420 90 420 120 390 140 Z" fill="#3f7d4e" />
                  <path d="M 370 180 C 350 170 330 150 360 135 C 380 140 380 160 370 180 Z" fill="#5aa06a" opacity="0.9" />
                </g>
                
                {/* Ladybug on the branch */}
                <g className="animated-bug">
                  {/* Legs */}
                  <path d="M -10 5 L -20 15 M 0 5 L 0 20 M 10 5 L 20 15" stroke="#1a160f" strokeWidth="3" strokeLinecap="round" />
                  <path d="M -10 -5 L -20 -15 M 0 -5 L 0 -20 M 10 -5 L 20 -15" stroke="#1a160f" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Underbody */}
                  <ellipse cx="0" cy="0" rx="22" ry="18" fill="#1a160f" />
                  
                  {/* Pronotum */}
                  <ellipse cx="16" cy="0" rx="8" ry="12" fill="#1a160f" />
                  <circle cx="18" cy="6" r="2.5" fill="#f0e7d0" />
                  <circle cx="18" cy="-6" r="2.5" fill="#f0e7d0" />
                  
                  {/* Eyes */}
                  <circle cx="22" cy="4" r="1.5" fill="#070605" />
                  <circle cx="22" cy="-4" r="1.5" fill="#070605" />
                  
                  {/* Elytra (wing covers) */}
                  <ellipse cx="-2" cy="0" rx="19" ry="17" fill="#cf2418" />
                  <path d="M -21 0 L 17 0" stroke="#1a160f" strokeWidth="2" />
                  
                  {/* Spots */}
                  <circle cx="6" cy="0" r="3.5" fill="#1a160f" />
                  <circle cx="-4" cy="8" r="3" fill="#1a160f" />
                  <circle cx="-4" cy="-8" r="3" fill="#1a160f" />
                  <circle cx="-12" cy="5" r="2.5" fill="#1a160f" />
                  <circle cx="-12" cy="-5" r="2.5" fill="#1a160f" />
                </g>
              </svg>
            </div>
          </>
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
