import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Bug, AlertCircle, Clock, Shield, Eye, EyeOff } from "lucide-react";
import { setParticipantSession } from "@/lib/participantSession";

export default function ParticipantGate({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\s/g, "");
    if (!cleanEmail) { setError("Please enter your email address"); return; }
    if (!cleanPhone) { setError("Please enter your phone number"); return; }

    setLoading(true);
    setError("");

    const results = await base44.entities.Registration.filter({
      email: cleanEmail,
      phone: cleanPhone,
    });

    setLoading(false);

    if (results.length === 0) {
      setError("Email or Participant ID is incorrect. Check your details or speak to a Marshal.");
      return;
    }

    const reg = results[0];

    if (!reg.checked_in) {
      setError("You haven't been checked in yet. Please visit the registration desk.");
      return;
    }

    setParticipantSession({ participant_id: reg.participant_id, name: reg.name, registration_id: reg.id });
    onSuccess({ participant_id: reg.participant_id, name: reg.name });
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Bug className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold">Participant Login</h2>
          <p className="text-sm text-muted-foreground mt-1">Use your registered email and password</p>
        </div>

        <Card>
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Email (username)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@email.com"
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Password</Label>
              <div className="relative">
                <Input
                  type={showPhone ? "text" : "password"}
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(""); }}
                  placeholder="Enter your password"
                  className="pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPhone((v) => !v)}
                >
                  {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={handleVerify} disabled={loading} className="w-full h-11">
              {loading ? "Verifying..." : "Sign In"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Your password is your registered phone number
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Your session is saved for this device
          </div>
        </div>
      </div>
    </div>
  );
}