import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, userAuth } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bug, Shield, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { cn } from "@/lib/utils";
import { useParticipantSession } from "@/components/ParticipantSessionProvider";
import { setMarshalSession } from "@/lib/marshalSession";

// ── Participant login form ──────────────────────────────────
function ParticipantForm() {
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
        participant_id: reg.participant_id,
        name: reg.name,
        registration_id: reg.registration_id,
      });
      navigate("/submit");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm">Email</Label>
        <Input type="email" value={email} autoComplete="email" autoFocus
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="you@email.com" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Phone Number (Password)</Label>
        <div className="relative">
          <Input type={showPhone ? "text" : "password"} value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(""); }}
            placeholder="Your registered phone number" className="pr-10" />
          <button type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPhone((v) => !v)}>
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
  );
}

// ── Marshal login form ──────────────────────────────────────
function MarshalForm() {
  const navigate = useNavigate();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) { setError("Please enter your email address"); return; }
    if (!password)   { setError("Please enter your password");       return; }

    setLoading(true);
    setError("");
    try {
      await auth.adminLogin(cleanEmail, password);
      const me = await auth.me();

      if (!me || me.role?.toLowerCase() !== "marshal") {
        auth.logout();
        setError("This account does not have marshal access.");
        return;
      }
      setMarshalSession({ id: me.id, name: me.name, email: me.email });
      navigate("/marshal/queue");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm">Email</Label>
        <Input type="email" value={email} autoComplete="email" autoFocus
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="your@email.com" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Password</Label>
        <div className="relative">
          <Input type={showPassword ? "text" : "password"} value={password} autoComplete="current-password"
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Enter your password" className="pr-10" />
          <button type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((v) => !v)}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
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
  );
}

// ── Combined login page ──────────────────────────────────────
export default function Login() {
  const [tab, setTab] = useState("participant");

  return (
    <AuthLayout
      icon={tab === "marshal" ? Shield : Bug}
      title={tab === "marshal" ? "Marshal Login" : "Participant Login"}
      subtitle={tab === "marshal" ? "Use your registered email and password" : "Use your registered email and phone number"}
    >
      <div className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-lg bg-muted">
        <button type="button"
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors",
            tab === "participant" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setTab("participant")}>
          <Bug className="w-3.5 h-3.5" /> Participant
        </button>
        <button type="button"
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors",
            tab === "marshal" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setTab("marshal")}>
          <Shield className="w-3.5 h-3.5" /> Marshal
        </button>
      </div>

      {tab === "participant" ? <ParticipantForm /> : <MarshalForm />}
    </AuthLayout>
  );
}
