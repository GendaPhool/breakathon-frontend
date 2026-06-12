import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import SeverityBadge from "@/components/SeverityBadge";
import ParticipantGateWrapper from "@/components/ParticipantGateWrapper";
import { useParticipantSession } from "@/components/ParticipantSessionProvider";

function MyReportsContent() {
  const { session: pSession } = useParticipantSession();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["myReports", pSession?.participant_id],
    queryFn: () => base44.entities.BugReport.filter({ participant_id: pSession.participant_id }, "-created_date"),
    enabled: !!pSession?.participant_id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" /> My Reports
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Reports for <span className="font-semibold text-primary">{pSession?.participant_id}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No reports submitted yet. Go submit your first bug!</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Report ID</th>
                  <th className="text-left p-3 font-semibold">Module</th>
                  <th className="text-left p-3 font-semibold">Bug Title</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Severity</th>
                  <th className="text-left p-3 font-semibold">Points</th>
                  <th className="text-left p-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs">#{r.id?.slice(-8)}</td>
                    <td className="p-3 text-xs">{r.module}</td>
                    <td className="p-3 font-medium">{r.bug_title}</td>
                    <td className="p-3"><StatusBadge status={r.status} /></td>
                    <td className="p-3"><SeverityBadge severity={r.severity} /></td>
                    <td className="p-3 font-semibold">{r.points_awarded || 0}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-muted-foreground">#{r.id?.slice(-8)}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <h3 className="font-semibold text-sm">{r.bug_title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{r.module}</span>
                    <span>·</span>
                    <SeverityBadge severity={r.severity} />
                    <span>·</span>
                    <span>{r.points_awarded || 0} pts</span>
                  </div>
                  {r.status === "Needs More Info" && r.marshal_notes && (
                    <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                      <span className="font-semibold">Marshal Note:</span> {r.marshal_notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyReports() {
  return (
    <ParticipantGateWrapper>
      <MyReportsContent />
    </ParticipantGateWrapper>
  );
}