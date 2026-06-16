import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { setMarshalSession } from "@/lib/marshalSession";

export default function MarshalLogin() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

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
      // hits POST /admin/login — backend rejects non-MARSHAL accounts
      await auth.adminLogin(cleanEmail, password);
      const me = await auth.me();

      if (!me || me.role?.toLowerCase() !== "marshal") {
        auth.logout();
        setError("This account does not have marshal access.");
        return;
      }
      setMarshalSession({ id: me.id, name: me.name, email: me.email });
      await checkUserAuth();
      navigate("/marshal/queue");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Shield}
      title="Marshal Login"
      subtitle="Use your registered email and password"
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
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="current-password"
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter your password"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
            >
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
    </AuthLayout>
  );
}
