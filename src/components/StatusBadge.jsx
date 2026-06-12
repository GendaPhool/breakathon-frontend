import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  "Pending Review": "bg-gray-100 text-gray-700 border-gray-200",
  "Validated": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Duplicate": "bg-amber-50 text-amber-700 border-amber-200",
  "Rejected": "bg-red-50 text-red-700 border-red-200",
  "Needs More Info": "bg-blue-50 text-blue-700 border-blue-200",
};

export default function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", statusStyles[status] || "")}>
      {status}
    </Badge>
  );
}