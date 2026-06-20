import FadeInWhenVisible from "@/components/motion/FadeInWhenVisible";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Zap, ListChecks } from "lucide-react";

const HIGHLIGHTS = [
  { icon: ShieldCheck, title: "Self-service registration", desc: "Online payment, instant confirmation." },
  { icon: Zap, title: "Live marshal dashboard", desc: "Submissions triaged in real time." },
  { icon: ListChecks, title: "Structured submissions", desc: "Duplicate-aware, evidence-required." },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-24">
      <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <FadeInWhenVisible>
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-accent mb-4">
            What is this
          </p>
          <h2 className="font-display italic font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-foreground">
            A real platform for a real bug hunt.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Running a bug-hunting competition by spreadsheet doesn't scale. So we built
            a real platform for it: self-service registration with online payment, a live
            marshal dashboard, structured bug submission with duplicate-awareness, and a
            public leaderboard that updates while the event is still running.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Genda Phool</span> is a
            flower-subscription &amp; delivery business. For the Break-A-Thon, its
            production apps go under the microscope — and you're the one looking.
          </p>
        </FadeInWhenVisible>

        <FadeInWhenVisible delay={0.15} className="space-y-4">
          {HIGHLIGHTS.map((h) => (
            <Card key={h.title} className="border-border">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <h.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">{h.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{h.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </FadeInWhenVisible>
      </div>
    </section>
  );
}
