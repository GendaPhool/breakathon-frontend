import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities, auth, uploadFile } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Copy, HelpCircle, ClipboardList } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import SeverityBadge from "@/components/SeverityBadge";
import BugDetailPanel from "@/components/marshal/BugDetailPanel";

const MODULES = [
  "All Modules", "Customer App", "Admin Dashboard", "Delivery Partner App",
  "Production Dashboard", "Route Management", "Subscription Management",
  "Payment System", "Wallet System", "Notification System",
];

const STATUSES = ["All Statuses", "Pending Review", "Validated", "Duplicate", "Rejected", "Needs More Info"];

export default function MarshalQueue() {
  const queryClient = useQueryClient();
  const [moduleFilter, setModuleFilter] = useState("All Modules");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedReport, setSelectedReport] = useState(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["allBugReports"],
    queryFn: () => entities.BugReport.list("created_date", 500),
  });

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (moduleFilter !== "All Modules" && r.module !== moduleFilter) return false;
      if (statusFilter !== "All Statuses" && r.status !== statusFilter) return false;
      return true;
    });
  }, [reports, moduleFilter, statusFilter]);

  const quickAction = useMutation({
    mutationFn: ({ id, data }) => entities.BugReport.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allBugReports"] }),
  });

  const handleQuickAction = (report, action) => {
    const updates = {
      validate: { status: "Validated" },
      reject: { status: "Rejected", points_awarded: 0 },
      duplicate: { status: "Duplicate", points_awarded: 0.5, is_confirming_duplicate: true },
      needsInfo: { status: "Needs More Info" },
    };
    quickAction.mutate({ id: report.id, data: updates[action] });
  };

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      <div className={`flex-1 flex flex-col overflow-hidden ${selectedReport ? "hidden lg:flex" : "flex"}`}>
        <div className="space-y-4 pb-4">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" /> Bug Queue
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length} reports</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">ID</th>
                  <th className="text-left p-3 font-semibold">Module</th>
                  <th className="text-left p-3 font-semibold">Bug Title</th>
                  <th className="text-left p-3 font-semibold">Participant</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Severity</th>
                  <th className="text-left p-3 font-semibold">Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${selectedReport?.id === r.id ? "bg-primary/5" : ""}`}
                    onClick={() => setSelectedReport(r)}
                  >
                    <td className="p-3 font-mono text-xs">#{r.id?.slice(-6)}</td>
                    <td className="p-3 text-xs">{r.module}</td>
                    <td className="p-3 font-medium max-w-[200px] truncate">{r.bug_title}</td>
                    <td className="p-3 text-xs">{r.participant_name}</td>
                    <td className="p-3"><StatusBadge status={r.status} /></td>
                    <td className="p-3"><SeverityBadge severity={r.severity} /></td>
                    <td className="p-3">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleQuickAction(r, "validate")} title="Validate">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50"
                          onClick={() => handleQuickAction(r, "reject")} title="Reject">
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-600 hover:bg-amber-50"
                          onClick={() => handleQuickAction(r, "duplicate")} title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleQuickAction(r, "needsInfo")} title="Needs Info">
                          <HelpCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedReport && (
        <div className="w-full lg:w-[420px] lg:min-w-[420px] border-l">
          <BugDetailPanel report={selectedReport} onClose={() => setSelectedReport(null)} />
        </div>
      )}
    </div>
  );
}