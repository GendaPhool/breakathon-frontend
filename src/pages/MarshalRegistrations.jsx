import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Download, Users, Clock, UserCheck, UserX } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const paymentStyles = {
  "Pending Verification": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Verified": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Rejected": "bg-red-50 text-red-700 border-red-200",
};

export default function MarshalRegistrations() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedReg, setSelectedReg] = useState(null);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["allRegistrations"],
    queryFn: () => entities.Registration.list("created_date", 500),
  });

  const filtered = useMemo(() => {
    if (statusFilter === "All") return registrations;
    return registrations.filter((r) => r.payment_status === statusFilter);
  }, [registrations, statusFilter]);

  const summary = useMemo(() => ({
    total: registrations.length,
    verified: registrations.filter((r) => r.payment_status === "Verified").length,
    pending: registrations.filter((r) => r.payment_status === "Pending Verification").length,
    rejected: registrations.filter((r) => r.payment_status === "Rejected").length,
  }), [registrations]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Registration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allRegistrations"] });
      setSelectedReg(null);
    },
  });

  const generateParticipantId = () => {
    const verified = registrations.filter((r) => r.payment_status === "Verified" && r.participant_id);
    const nums = verified.map((r) => {
      const m = r.participant_id?.match(/GP-(\d+)/);
      return m ? parseInt(m[1]) : 0;
    });
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `GP-${String(next).padStart(3, "0")}`;
  };

  const verify = (reg) => {
    const pid = generateParticipantId();
    updateMutation.mutate({ id: reg.id, data: { payment_status: "Verified", participant_id: pid } });
  };

  const reject = (reg) => {
    updateMutation.mutate({ id: reg.id, data: { payment_status: "Rejected" } });
  };

  const exportCSV = () => {
    const verified = registrations.filter((r) => r.payment_status === "Verified");
    const headers = ["Participant ID", "Name", "Email", "Phone", "City", "Occupation", "Payment Reference", "Registered At"];
    const rows = verified.map((r) => [
      r.participant_id || "", r.name, r.email, r.phone, r.city, r.occupation,
      r.payment_reference, new Date(r.created_date).toLocaleString()
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "verified_registrations.csv"; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Registrations
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage payment verification</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: summary.total, icon: Users, color: "text-primary" },
          { label: "Verified", value: summary.verified, icon: UserCheck, color: "text-emerald-600" },
          { label: "Pending", value: summary.pending, icon: Clock, color: "text-yellow-600" },
          { label: "Rejected", value: summary.rejected, icon: UserX, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Pending Verification">Pending Verification</SelectItem>
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold">Email</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">Phone</th>
                <th className="text-left p-3 font-semibold hidden lg:table-cell">City</th>
                <th className="text-left p-3 font-semibold hidden lg:table-cell">Payment Ref</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Participant ID</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedReg(r)}>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.email}</td>
                  <td className="p-3 hidden md:table-cell text-xs">{r.phone}</td>
                  <td className="p-3 hidden lg:table-cell text-xs">{r.city}</td>
                  <td className="p-3 hidden lg:table-cell font-mono text-xs">{r.payment_reference}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-xs ${paymentStyles[r.payment_status] || ""}`}>
                      {r.payment_status}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs font-semibold">{r.participant_id || "—"}</td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {r.payment_status !== "Verified" && (
                        <Button size="sm" variant="ghost" className="h-7 text-emerald-600 hover:bg-emerald-50 text-xs gap-1"
                          onClick={() => verify(r)}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                        </Button>
                      )}
                      {r.payment_status !== "Rejected" && (
                        <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-50 text-xs gap-1"
                          onClick={() => reject(r)}>
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No registrations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedReg} onOpenChange={(open) => !open && setSelectedReg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          {selectedReg && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Name", selectedReg.name],
                  ["Email", selectedReg.email],
                  ["Phone", selectedReg.phone],
                  ["City", selectedReg.city],
                  ["Occupation", selectedReg.occupation],
                  ["How they heard", selectedReg.how_did_you_hear],
                  ["Payment Ref", selectedReg.payment_reference],
                  ["Registered At", new Date(selectedReg.created_date).toLocaleString()],
                  ["Participant ID", selectedReg.participant_id || "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="font-medium break-all">{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                {selectedReg.payment_status !== "Verified" && (
                  <Button size="sm" className="flex-1 gap-2" onClick={() => verify(selectedReg)}>
                    <CheckCircle2 className="w-4 h-4" /> Verify Payment
                  </Button>
                )}
                {selectedReg.payment_status !== "Rejected" && (
                  <Button size="sm" variant="destructive" className="flex-1 gap-2" onClick={() => reject(selectedReg)}>
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}