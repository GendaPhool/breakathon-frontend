import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RevealText from "@/components/motion/RevealText";
import { EXPO_OUT } from "@/components/motion/easing";

export default function FinalCTASection() {
  const reduce = useReducedMotion();

  return (
    // Reuse the .dark tokens again — bookends the page, echoes the hero.
    <section className="dark relative overflow-hidden bg-background py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(46,138,230,0.18),transparent_65%)]" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <RevealText
          text="The bugs are waiting."
          as="h2"
          className="font-display italic font-bold text-white text-4xl sm:text-5xl lg:text-6xl leading-tight"
        />
        <motion.p
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reduce ? { duration: 0.01 } : { duration: 0.7, ease: EXPO_OUT, delay: 0.3 }}
          className="mt-6 text-lg text-white/75"
        >
          Register, check in, and start hunting. ₹149 gets you in the game.
        </motion.p>
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reduce ? { duration: 0.01 } : { duration: 0.7, ease: EXPO_OUT, delay: 0.45 }}
          className="mt-8"
        >
          <Link to="/event-register">
            <Button size="lg" className="font-heading font-semibold gap-2 text-base h-12 px-8">
              Register for ₹149 <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
