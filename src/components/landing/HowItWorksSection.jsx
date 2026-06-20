import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { UserPlus, CreditCard, BadgeCheck, Search, Trophy } from "lucide-react";
import LottieOrFallback from "./LottieOrFallback";
import bugHuntingLottie from "@/assets/lottie/bug-hunting.lottie?url";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    icon: UserPlus,
    title: "Register",
    desc: "Fill in your details and tell us how you heard about the event.",
  },
  {
    icon: CreditCard,
    title: "Pay ₹149",
    desc: "Secure Razorpay checkout with an instant confirmation email.",
  },
  {
    icon: BadgeCheck,
    title: "Check In",
    desc: "Show up, get verified at the desk, and receive your Participant ID.",
  },
  {
    icon: Search,
    title: "Hunt",
    desc: "Once the marshal starts the event, pick a module, check the duplicate list, then submit: title, steps to reproduce, expected vs actual, and a required screenshot (optional screen recording too).",
    lottie: true,
  },
  {
    icon: Trophy,
    title: "Get Scored",
    desc: "A marshal validates your bug, assigns a severity, and your points hit the live leaderboard.",
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef(null);
  const lineRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !sectionRef.current) return;
    const ctx = gsap.context(() => {
      // The connecting line draws itself as the user scrolls past the steps.
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 60%",
              end: "bottom 75%",
              scrub: 0.5,
            },
          }
        );
      }

      // Each step card animates in as the line reaches it.
      sectionRef.current.querySelectorAll("[data-step]").forEach((step) => {
        gsap.fromTo(
          step,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: { trigger: step, start: "top 80%" },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="max-w-2xl mb-16">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-accent mb-4">
            The flow
          </p>
          <h2 className="font-display italic font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-foreground">
            How it works.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From signup to scoreboard in five steps.
          </p>
        </div>

        <div className="relative pl-12 sm:pl-16">
          {/* track + animated draw line */}
          <div className="absolute left-[22px] sm:left-[30px] top-2 bottom-2 w-0.5 bg-border" aria-hidden="true" />
          <div
            ref={lineRef}
            className="absolute left-[22px] sm:left-[30px] top-2 bottom-2 w-0.5 bg-accent origin-top"
            aria-hidden="true"
          />

          <div className="space-y-12">
            {STEPS.map((step, i) => (
              <div key={step.title} data-step className="relative">
                {/* node */}
                <div className="absolute -left-12 sm:-left-16 top-0 flex items-center justify-center">
                  <div className="w-11 h-11 sm:w-[60px] sm:h-[60px] rounded-2xl bg-primary flex items-center justify-center shadow-lg ring-4 ring-background">
                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-sm text-accent">
                      Step {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-xl sm:text-2xl text-foreground mt-1">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 leading-relaxed max-w-xl">{step.desc}</p>

                  {step.lottie && (
                    <LottieOrFallback
                      src={bugHuntingLottie}
                      className="mt-5 w-44 h-44"
                      fallback={
                        <div className="w-44 h-44 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                          <Search className="w-16 h-16 text-accent/70" strokeWidth={1.25} />
                        </div>
                      }
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
