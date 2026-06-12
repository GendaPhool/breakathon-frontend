import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Bug, AlertTriangle, Trophy } from "lucide-react";
import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STATUS_COLORS = {
  "Pending Review": "#9ca3af",
  "Validated": "#10b981",
  "Duplicate": "#f59e0b",
  "Rejected": "#ef4444",
  "Needs More Info": "#3b82f6",
};

const SEVERITY_COLORS = {
  "Launch Blocker": "#dc2626",
  "Critical": "#ef4444",
  "High": "#f97316",
  "Medium": "#eab308",
  "Low": "#94a3b8",
};

export default function MarshalStats() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["allBugReports"],
    queryFn: () => base44.entities.BugReport.list("-created_date", 500),
  });

  const stats = useMemo(() => {
    const byStatus = {};
    const byModule = {};
    const bySeverity = {};
    const byParticipant = {};
    let launchBlockers = 0;

    reports.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byModule[r.module] = (byModule[r.module] || 0) + 1;
      if (r.severity) {
        bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
        if (r.severity === "Launch Blocker") launchBlockers++;
      }
      if (!byParticipant[r.participant_name]) {
        byParticipant[r.participant_name] = 0;
      }
      byParticipant[r.participant_name] += r.points_awarded || 0;
    });

    const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));
    const moduleData = Object.entries(byModule)
      .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, fullName: name, value }))
      .sort((a, b) => b.value - a.value);
    const severityData = Object.entries(bySeverity).map(([name, value]) => ({ name, value }));
    const topParticipants = Object.entries(byParticipant)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, points]) => ({ name, points }));

    return { statusData, moduleData, severityData, topParticipants, launchBlockers, total: reports.length };
  }, [reports]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-primary" /> Stats Dashboard
        </h1>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Reports</p>
            <p className="text-3xl font-display font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Validated</p>
            <p className="text-3xl font-display font-bold text-emerald-600 mt-1">
              {stats.statusData.find((d) => d.name === "Validated")?.value || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Review</p>
            <p className="text-3xl font-display font-bold text-muted-foreground mt-1">
              {stats.statusData.find((d) => d.name === "Pending Review")?.value || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-xs text-red-600 font-medium">Launch Blockers</p>
              <p className="text-3xl font-display font-bold text-red-700">{stats.launchBlockers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">By Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                    {stats.statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#ccc"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Module breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">By Module</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.moduleData} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""} />
                  <Bar dataKey="value" fill="hsl(24, 74%, 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">By Severity</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                    {stats.severityData.map((entry) => (
                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || "#ccc"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top participants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" /> Top 5 Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topParticipants.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <span className="font-medium text-sm">{p.name}</span>
                  </div>
                  <span className="font-semibold text-sm">{p.points} pts</span>
                </div>
              ))}
              {stats.topParticipants.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}