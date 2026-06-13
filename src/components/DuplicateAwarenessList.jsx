import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/apiClient";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function DuplicateAwarenessList({ module, confirmed, onConfirm }) {
  const { data: recentBugs = [], isLoading } = useQuery({
    queryKey: ["recentBugs", module],
    queryFn: () => entities.BugReport.filter({ module }, "-created_date", 10),
    enabled: !!module,
  });

  if (!module) return null;

  return (
    <div className="rounded-xl border bg-amber-50/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-700">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-semibold text-sm">Recent bugs in {module}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading recent reports...
        </div>
      ) : recentBugs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent bugs filed for this module yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {recentBugs.map((bug) => (
            <li key={bug.id} className="text-sm text-foreground/80 pl-2 border-l-2 border-amber-200 py-0.5">
              <span className="font-mono text-xs text-muted-foreground mr-2">#{bug.id?.slice(-6)}</span>
              {bug.bug_title}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-start gap-3 pt-2 border-t border-amber-200">
        <Checkbox
          id="duplicate-check"
          checked={confirmed}
          onCheckedChange={onConfirm}
          className="mt-0.5"
        />
        <label htmlFor="duplicate-check" className="text-sm font-medium leading-snug cursor-pointer">
          I confirm this is not a duplicate of any of the above reports
        </label>
      </div>
    </div>
  );
}