import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities, auth, uploadFile } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, UserCheck, Printer, Search } from "lucide-react";

export default function MarshalCheckin() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [justCheckedIn, setJustCheckedIn] = useState(null);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["allRegistrations"],
    queryFn: () => entities.Registration.list("created_date", 500),
  });

  const stats = useMemo(() => {
    const verified = registrations.filter((r) => r.payment_status === "Verified");
    const checkedIn = verified.filter((r) => r.checked_in);
    return { total: verified.length, checkedIn: checkedIn.length };
  }, [registrations]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return registrations.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.participant_id?.toLowerCase().includes(q) ||
        r.phone?.includes(q)
    );
  }, [registrations, query]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Registration.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["allRegistrations"] });
      if (vars.data.checked_in) setJustCheckedIn(vars.id);
    },
  });

  const checkIn = (reg) => {
    updateMutation.mutate({
      id: reg.id,
      data: { checked_in: true, checked_in_at: new Date().toISOString() },
    });
  };

  const toggleBadge = (reg) => {
    updateMutation.mutate({ id: reg.id, data: { badge_printed: !reg.badge_printed } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-primary" /> Event Day Check-In
        </h1>
      </div>

      {/* Counter */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Checked In</p>
              <p className="text-4xl font-display font-bold text-primary">{stats.checkedIn}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">of {stats.total} verified</p>
              <div className="mt-1 h-2 w-32 bg-primary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: stats.total > 0 ? `${(stats.checkedIn / stats.total) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setJustCheckedIn(null); }}
          placeholder="Search by name, participant ID, or phone..."
          className="pl-9 h-12"
        />
      </div>

      {/* Results */}
      {query.trim() && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-center text-muted-foreground text-sm">
                No registrations found for "{query}"
              </CardContent>
            </Card>
          ) : (
            results.map((reg) => <RegistrationCard
              key={reg.id}
              reg={reg}
              onCheckIn={checkIn}
              onToggleBadge={toggleBadge}
              justCheckedIn={justCheckedIn === reg.id}
            />)
          )}
        </div>
      )}

      {!query.trim() && (
        <p className="text-center text-muted-foreground text-sm py-8">
          Type a name, participant ID, or phone to search
        </p>
      )}
    </div>
  );
}

function RegistrationCard({ reg, onCheckIn, onToggleBadge, justCheckedIn }) {
  const canCheckIn = reg.payment_status === "Verified" && !reg.checked_in;
  const alreadyCheckedIn = reg.checked_in;
  const notVerified = reg.payment_status !== "Verified";

  return (
    <Card className={`border-2 transition-colors ${
      justCheckedIn ? "border-emerald-400 bg-emerald-50/50" :
      alreadyCheckedIn ? "border-emerald-200" :
      notVerified ? "border-red-200 bg-red-50/30" : "border-border"
    }`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{reg.name}</p>
            <p className="text-sm text-muted-foreground">{reg.email}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {reg.participant_id && (
              <span className="font-mono text-sm font-bold text-primary">{reg.participant_id}</span>
            )}
            <Badge variant="outline" className={`text-xs ${
              reg.payment_status === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              reg.payment_status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
              "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}>
              {reg.payment_status}
            </Badge>
          </div>
        </div>

        {justCheckedIn && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100 rounded-lg p-3 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Checked in successfully!
          </div>
        )}

        {alreadyCheckedIn && !justCheckedIn && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg p-3 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Already checked in at {reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleTimeString() : "—"}
          </div>
        )}

        {notVerified && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg p-3 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" /> Payment not verified. Cannot check in.
          </div>
        )}

        <div className="flex gap-2">
          {canCheckIn && (
            <Button onClick={() => onCheckIn(reg)} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Check In
            </Button>
          )}
          {alreadyCheckedIn && (
            <Button
              variant={reg.badge_printed ? "secondary" : "outline"}
              onClick={() => onToggleBadge(reg)}
              className="flex-1 gap-2"
            >
              <Printer className="w-4 h-4" />
              {reg.badge_printed ? "Badge Printed ✓" : "Mark Badge Printed"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}