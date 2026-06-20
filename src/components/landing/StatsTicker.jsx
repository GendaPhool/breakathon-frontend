import FadeInWhenVisible from "@/components/motion/FadeInWhenVisible";
import CountUp from "@/components/motion/CountUp";

const STATS = [
  { value: 149, prefix: "₹", label: "Registration" },
  { value: 9, label: "Modules in Scope" },
  { value: 6, label: "Severity Tiers" },
  { value: 60, suffix: "s", label: "Leaderboard Refresh" },
  { value: 3, prefix: "Top ", label: "Take the Podium" },
];

export default function StatsTicker() {
  return (
    <section className="border-y border-border bg-card">
      <FadeInWhenVisible className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-6">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center text-center px-2 ${
                i < STATS.length - 1 ? "lg:border-r lg:border-border" : ""
              }`}
            >
              <span className="font-heading font-bold text-3xl sm:text-4xl text-primary tabular-nums">
                <CountUp end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </span>
              <span className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </FadeInWhenVisible>
    </section>
  );
}
