import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAuth } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bug, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useParticipantSession } from "@/components/ParticipantSessionProvider";

export default function ParticipantLogin() {
  const navigate = useNavigate();
  const { login: setParticipantSession } = useParticipantSession();

  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\s/g, "");
    if (!cleanEmail) { setError("Please enter your email address"); return; }
    if (!cleanPhone) { setError("Please enter your phone number");  return; }

    setLoading(true);
    setError("");
    try {
      const reg = await userAuth.login(cleanEmail, cleanPhone);
      setParticipantSession({
        participant_id:  reg.participant_id,
        name:            reg.name,
        registration_id: reg.registration_id,
      });
<<<<<<< HEAD
      navigate("/");
=======
      navigate("/submit");
>>>>>>> 97d450abc3e2def69eb53297fdb74819ae42e162
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Bug}
      title="Participant Login"
      subtitle="Use your registered email and phone number"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm">Email</Label>
          <Input
            type="email"
            value={email}
            autoComplete="email"
            autoFocus
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="you@email.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Phone Number (Password)</Label>
          <div className="relative">
            <Input
              type={showPhone ? "text" : "password"}
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(""); }}
              placeholder="Your registered phone number"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPhone((v) => !v)}
            >
              {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Your password is your registered phone number</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In"}
        </Button>
      </form>
    </AuthLayout>
  );
}
