import { Shield } from "lucide-react";
import FadeInWhenVisible from "@/components/motion/FadeInWhenVisible";
import LottieOrFallback from "./LottieOrFallback";
import developerReviewLottie from "@/assets/lottie/developer-review.lottie?url";

export default function MarshalsSection() {
  return (
    <section id="marshals" className="py-24 bg-secondary/40">
      <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <FadeInWhenVisible>
          <LottieOrFallback
            src={developerReviewLottie}
            className="w-full max-w-sm mx-auto aspect-square"
            fallback={
              <div className="w-full max-w-sm mx-auto aspect-square rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-center">
                <Shield className="w-24 h-24 text-primary/60" strokeWidth={1.1} />
              </div>
            }
          />
        </FadeInWhenVisible>

        <FadeInWhenVisible delay={0.1}>
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-accent mb-4">
            For marshals
          </p>
          <h2 className="font-display italic font-bold text-3xl sm:text-4xl leading-tight text-foreground">
            Reviewed live, kept fair.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Behind every submission is a marshal reviewing it live — checking severity,
            catching duplicates, keeping the board fair while the event is still running.
          </p>
        </FadeInWhenVisible>
      </div>
    </section>
  );
}
