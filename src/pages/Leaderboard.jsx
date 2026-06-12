import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Bug, CheckCircle2, Crown, Medal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";

export default function Leaderboard() {
  const { data: allReports = [], isLoading } = useQuery({
    queryKey: ["leaderboardReports"],
    queryFn: () => base44.entities.BugReport.list("-created_date", 500),
    refetchInterval: 60000,
  });

  const { leaderboard, totalBugs, totalValidated } = useMemo(() => {
    const participantMap = {};
    allReports.forEach((r) => {
      const pid = r.participant_id;
      if (!participantMap[pid]) {
        participantMap[pid] = {
          name: r.participant_name,
          total_points: 0,
          reports_submitted: 0,
          reports_validated: 0,
        };
      }
      participantMap[pid].reports_submitted += 1;
      participantMap[pid].total_points += r.points_awarded || 0;
      if (r.status === "Validated") participantMap[pid].reports_validated += 1;
    });

    const sorted = Object.values(participantMap).sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return b.reports_validated - a.reports_validated;
    });

    return {
      leaderboard: sorted,
      totalBugs: allReports.length,
      totalValidated: allReports.filter((r) => r.status === "Validated").length,
    };
  }, [allReports]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumHeights = ["h-28", "h-36", "h-24"];
  const podiumColors = [
    "from-slate-300 to-slate-400",
    "from-amber-400 to-yellow-500",
    "from-orange-300 to-orange-400",
  ];
  const podiumIcons = [Medal, Crown, Medal];
  const podiumRanks = [2, 1, 3];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" /> Leaderboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Auto-refreshes every 60 seconds</p>
      </div>

      {/* Stats counters */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bug className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{totalBugs}</p>
              <p className="text-xs text-muted-foreground">Total Bugs Found</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{totalValidated}</p>
              <p className="text-xs text-muted-foreground">Validated Bugs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No reports yet. Be the first!</CardContent></Card>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3 pt-8 pb-4">
              {podiumOrder.map((p, i) => {
                if (!p) return <div key={i} className="w-28" />;
                const Icon = podiumIcons[i];
                const rank = podiumRanks[i];
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="relative mb-2">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30">
                        <span className="font-display font-bold text-lg">{p.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    </div>
                    <p className="font-semibold text-sm text-center truncate w-24">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.total_points} pts</p>
                    <div className={`w-24 ${podiumHeights[i]} bg-gradient-to-t ${podiumColors[i]} rounded-t-xl mt-2 flex items-center justify-center`}>
                      <span className="text-white font-display font-bold text-2xl">#{rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of leaderboard */}
          {rest.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold w-12">Rank</th>
                      <th className="text-left p-3 font-semibold">Name</th>
                      <th className="text-center p-3 font-semibold">Validated</th>
                      <th className="text-right p-3 font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((p, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-3 font-mono text-muted-foreground">#{i + 4}</td>
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-center">{p.reports_validated}</td>
                        <td className="p-3 text-right font-semibold">{p.total_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}