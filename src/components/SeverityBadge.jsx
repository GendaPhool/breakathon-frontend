import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const severityStyles = {
  "Launch Blocker": "bg-red-600 text-white border-red-600",
  "Critical": "bg-red-100 text-red-800 border-red-300",
  "High": "bg-orange-100 text-orange-800 border-orange-300",
  "Medium": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Low": "bg-slate-100 text-slate-600 border-slate-300",
};

export default function SeverityBadge({ severity }) {
  if (!severity) return <span className="text-xs text-muted-foreground italic">—</span>;
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", severityStyles[severity] || "")}>
      {severity}
    </Badge>
  );
}