import FadeInWhenVisible from "@/components/motion/FadeInWhenVisible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "What if registration closes before I sign up?",
    a: "Registration closes at the deadline set by the organizers, or once the participant cap is reached — whichever comes first. Once it's closed, new signups aren't accepted, so register early to lock your spot.",
  },
  {
    q: "Can I submit bugs before the event officially starts?",
    a: "No. Submissions only open once a marshal starts the event on the day. Until then you can register, pay, and check in — but the hunt begins on the marshal's go.",
  },
  {
    q: "What happens if someone else already reported my bug?",
    a: "Before you submit, you'll see a duplicate-awareness list of what's already been reported. If your bug turns out to be a duplicate, it still earns a small 0.5 points for being thorough — original validated bugs earn the full severity points.",
  },
  {
    q: "How do I log in to submit bugs?",
    a: "Just your email and phone number — no password needed. We validate them against your checked-in, verified registration and hand you straight to the submission form.",
  },
  {
    q: "Is the leaderboard live during the event?",
    a: "Yes. It auto-refreshes every 60 seconds throughout the event, so rankings stay current — unless the organizer chooses to hide it before things kick off.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-4">
        <FadeInWhenVisible className="text-center mb-12">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-accent mb-4">
            Questions
          </p>
          <h2 className="font-display italic font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-foreground">
            Frequently asked.
          </h2>
        </FadeInWhenVisible>

        <FadeInWhenVisible delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-base font-heading font-semibold text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeInWhenVisible>
      </div>
    </section>
  );
}
