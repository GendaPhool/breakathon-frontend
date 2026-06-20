import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import {
  Smartphone,
  LayoutDashboard,
  Truck,
  Factory,
  Map,
  Repeat,
  CreditCard,
  Wallet,
  Bell,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

gsap.registerPlugin(ScrollTrigger);

const MODULES = [
  { icon: Smartphone, name: "Customer App", hint: "Where customers browse, order & subscribe." },
  { icon: LayoutDashboard, name: "Admin Dashboard", hint: "The control room for the whole business." },
  { icon: Truck, name: "Delivery Partner App", hint: "What riders use on the road." },
  { icon: Factory, name: "Production Dashboard", hint: "Bouquets prepped & batched here." },
  { icon: Map, name: "Route Management", hint: "Planning who delivers where." },
  { icon: Repeat, name: "Subscription Management", hint: "Recurring flower plans & renewals." },
  { icon: CreditCard, name: "Payment System", hint: "Checkout, refunds & reconciliation." },
  { icon: Wallet, name: "Wallet System", hint: "Balances, credits & cashback." },
  { icon: Bell, name: "Notification System", hint: "Emails, SMS & push alerts." },
];

export default function ModulesSection() {
  const gridRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !gridRef.current) return;
    const cards = gridRef.current.querySelectorAll("[data-module-card]");
    const ctx = gsap.context(() => {
      gsap.set(cards, { opacity: 0, y: 40, scale: 0.96 });
      ScrollTrigger.batch(cards, {
        start: "top 85%",
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: "expo.out",
            stagger: 0.08,
            overwrite: true,
          }),
      });
    }, gridRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section id="modules" className="py-24 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-accent mb-4">
            The scope
          </p>
          <h2 className="font-display italic font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-foreground">
            What you'll be testing.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Nine real, live modules. Pick a target and start breaking.
          </p>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((m) => (
            <Card key={m.name} data-module-card className="border-border hover:border-accent/50 transition-colors group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-accent/10 flex items-center justify-center mb-4 transition-colors">
                  <m.icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground">{m.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{m.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
