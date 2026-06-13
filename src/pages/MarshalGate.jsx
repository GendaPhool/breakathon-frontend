import { useState } from "react";
import { auth } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function MarshalGate({ onSuccess }) {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const handleVerify = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) { setError("Please enter your email address"); return; }
    if (!password)   { setError("Please enter your password");       return; }

    setLoading(true);
    setError("");
    try {
      const data = await auth.login(cleanEmail, password);
      const me   = await auth.me();

      if (!me || me.role?.toLowerCase() !== "marshal") {
        auth.logout();
        setError("This account does not have marshal access.");
        return;
      }
      onSuccess({ id: me.id, name: me.name, email: me.email });
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-background">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold">Marshal Login</h2>
          <p className="text-sm text-muted-foreground mt-1">Use your registered email and password</p>
        </div>

        <Card>
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="your@email.com"
                onKeyDown={(e) => e.key === "Enter" && handleVerify()} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Password</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter your password" className="pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()} />
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

            <Button onClick={handleVerify} disabled={loading} className="w-full h-11">
              {loading ? "Verifying..." : "Sign In"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
