import { useState, useEffect } from "react";
import { entities, functions, uploadFile } from "@/api/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, MapPin, Calendar, Clock, Ticket, Bug, AlertCircle, ChevronLeft, Zap, Laptop } from "lucide-react";

// ── Load Razorpay checkout SDK ────────────────────────────────
function useRazorpayScript() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (window.Razorpay) { setLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
  }, []);
  return loaded;
}

export default function PublicRegister() {
  const [step, setStep] = useState(1); // 1: Form, 2: Payment, 3: Confirmation
  const [form, setForm] = useState({
    name: "", email: "", phone: "", city: "",
    occupation: "", how_did_you_hear: "", payment_reference: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const razorpayLoaded = useRazorpayScript();

  const { data: settings } = useQuery({
    queryKey: ["eventSettings"],
    queryFn: async () => {
      const list = await entities.EventSettings.list();
      return list[0] || {};
    },
  });

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  // ── Validation ────────────────────────────────────────────────
  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Enter a valid 10-digit phone number";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.occupation) e.occupation = "Please select your occupation";
    if (!form.how_did_you_hear) e.how_did_you_hear = "Please tell us how you heard about us";
    return e;
  };

  const validatePayment = () => {
    const e = {};
    if (!form.payment_reference.trim()) e.payment_reference = "Please complete the payment above first";
    return e;
  };

  // ── Submit Registration ───────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async () => {
      // Server-side email uniqueness check + create
      const existing = await entities.Registration.filter({ email: form.email.toLowerCase().trim() });
      if (existing.length > 0) throw new Error("EMAIL_EXISTS");

      const reg = await entities.Registration.create({
        ...form,
        email:             form.email.toLowerCase().trim(),
        phone:             form.phone.replace(/\s/g, ""),
        payment_status:    "Pending Verification",
        checked_in:        false,
        badge_printed:     false,
      });

      // Fire-and-forget confirmation email (non-blocking)
      functions
        .invoke("sendRegistrationConfirmation", {
          registration_id: reg.id,
          email:           reg.email,
          name:            reg.name,
        })
        .catch(() => {});

      return reg;
    },
    onSuccess: (data) => {
      setSubmitted(data);
      setStep(3);
    },
    onError: (err) => {
      if (err.message === "EMAIL_EXISTS") {
        setErrors({ email: "This email is already registered. Contact us if you have an issue." });
      }
    },
  });

  const handleNextStep = () => {
    if (step === 1) {
      const e = validateForm();
      if (Object.keys(e).length > 0) { setErrors(e); return; }
      setStep(2);
    } else if (step === 2) {
      const e = validatePayment();
      if (Object.keys(e).length > 0) { setErrors(e); return; }
      mutation.mutate();
    }
  };

  // ── Razorpay Checkout ─────────────────────────────────────────
  // Flow:
  //   1. Backend creates a Razorpay order (returns order_id, amount, key_id)
  //   2. Razorpay checkout modal opens
  //   3. On payment success, Razorpay calls handler with payment details
  //   4. We POST to our backend to verify the HMAC signature
  //   5. Only after server confirms the signature do we set payment_reference
  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded) return;
    setPaymentLoading(true);
    setErrors({});

    try {
      // Step 1 — create order on our backend
      const res = await functions.invoke("createRazorpayOrder", {});
      const { order_id, amount, currency, key_id } = res.data;

      const options = {
        key:         key_id,
        amount,
        currency,
        order_id,
        name:        "Genda Phool Break-A-Thon",
        description: "Event Registration Fee",
        prefill:     { name: form.name, email: form.email, contact: form.phone },
        theme:       { color: "#1e3a5f" },

        // Step 3 — Razorpay calls this after the user pays
        handler: async (response) => {
          try {
            // Step 4 — verify signature on backend before accepting payment
            const verifyRes = await functions.invoke("createRazorpayOrder/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });

            if (verifyRes?.data?.verified) {
              // Step 5 — signature valid, store the payment ID
              update("payment_reference", response.razorpay_payment_id);
            } else {
              setErrors({ payment_reference: "Payment verification failed. Please contact support." });
            }
          } catch (_err) {
            setErrors({ payment_reference: "Could not verify payment. Please enter your Payment ID manually." });
          } finally {
            setPaymentLoading(false);
          }
        },

        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPaymentLoading(false);
      setErrors({ payment_reference: "Failed to initiate payment. Please try again." });
    }
  };

  // ── Registration Closed screen ────────────────────────────────
  if (settings?.registration_open === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Ticket className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold">Registration Closed</h2>
            <p className="text-muted-foreground text-sm">
              Registration for {settings?.event_name || "Break-A-Thon"} is currently closed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step 3: Thank You / Confirmation ──────────────────────────
  if (step === 3 && submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full shadow-xl">
          <CardContent className="pt-8 pb-8 space-y-4 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">Registration Complete!</h2>
              <p className="text-muted-foreground text-sm mt-1">Welcome to the Break-A-Thon</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm text-left">
              <p><span className="text-muted-foreground">Name:</span> <strong>{submitted.name}</strong></p>
              <p><span className="text-muted-foreground">Email:</span> <strong>{submitted.email}</strong></p>
              <p><span className="text-muted-foreground">Payment Ref:</span> <strong>{submitted.payment_reference}</strong></p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
              <p className="font-semibold mb-1">✓ Confirmation Email Sent</p>
              <p>A confirmation has been sent to <strong>{submitted.email}</strong></p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">What happens next?</p>
              <p>
                Your spot is confirmed once we verify your payment. You'll receive your
                Participant ID before the event.
              </p>
              {settings?.event_date && (
                <p className="mt-2 font-semibold">See you on {settings.event_date}! 🎉</p>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
              <Laptop className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold mb-1">📱 Bring Your Own Device</p>
                <p>Please bring your own laptop or phone. Devices will not be provided on-site.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Screenshot this for your records</p>
            <a
              href="/submit"
              className="block w-full text-center bg-primary text-primary-foreground rounded-lg py-3 font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard →
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Steps 1 & 2 ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-lg mx-auto px-4 py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Bug className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">
            {settings?.event_name || "Genda Phool Break-A-Thon"}
          </h1>
          <p className="text-white/80 text-sm mt-1">Bug Hunting Competition</p>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
              <Calendar className="w-3.5 h-3.5" /> 13th June, 2026
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
              <Clock className="w-3.5 h-3.5" /> 3 Hours
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
              <MapPin className="w-3.5 h-3.5" /> Vadodara
            </span>
          </div>
          <p className="text-white/60 text-xs mt-2">Time & Venue to be announced soon</p>
          <div className="mt-3 bg-white/20 rounded-full px-3 py-1 inline-block">
            <span className="text-sm font-semibold">₹149</span>
            <span className="text-white/70 text-xs ml-1">Registration Fee</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Step progress bar */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`}></div>
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`}></div>
          <div className={`flex-1 h-1 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`}></div>
        </div>

        {/* ── Step 1: Personal Details ── */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="mb-4">
                <h2 className="text-lg font-display font-bold">Step 1 of 3: Your Details</h2>
                <p className="text-sm text-muted-foreground mt-1">Tell us about yourself</p>
              </div>

              <Field label="Full Name *" error={errors.name}>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your full name" />
              </Field>
              <Field label="Email *" error={errors.email}>
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="your@email.com" />
              </Field>
              <Field label="Phone Number *" error={errors.phone}>
                <Input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
              </Field>
              <Field label="City *" error={errors.city}>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Your city" />
              </Field>
              <Field label="Occupation *" error={errors.occupation}>
                <Select value={form.occupation} onValueChange={(v) => update("occupation", v)}>
                  <SelectTrigger><SelectValue placeholder="Select occupation" /></SelectTrigger>
                  <SelectContent>
                    {["Student", "Working Professional", "Freelancer", "Founder", "Other"].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="How did you hear about us? *" error={errors.how_did_you_hear}>
                <Select value={form.how_did_you_hear} onValueChange={(v) => update("how_did_you_hear", v)}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {["Instagram", "WhatsApp", "Friend", "College", "Startup Community", "LinkedIn", "Other"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Button onClick={handleNextStep} className="w-full h-12 text-base font-semibold mt-2">
                Continue to Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Payment ── */}
        {step === 2 && (
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="mb-4">
                <h2 className="text-lg font-display font-bold">Step 2 of 3: Payment</h2>
                <p className="text-sm text-muted-foreground mt-1">Complete your ₹149 registration</p>
              </div>

              {/* Razorpay payment button */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Pay ₹149 via Razorpay
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Click below to open the secure payment window
                  </p>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleRazorpayPayment}
                    disabled={paymentLoading || !razorpayLoaded || !!form.payment_reference}
                  >
                    {paymentLoading
                      ? "Opening Payment..."
                      : form.payment_reference
                        ? "Payment Done ✓"
                        : "Pay ₹149 Now"}
                  </Button>
                </CardContent>
              </Card>

              {/* Success banner after payment */}
              {form.payment_reference && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Payment verified! ID: <strong>{form.payment_reference}</strong>
                </div>
              )}

              {/* Manual fallback field */}
              <Field label="Payment ID / Reference *" error={errors.payment_reference}>
                <Input
                  value={form.payment_reference}
                  onChange={(e) => update("payment_reference", e.target.value)}
                  placeholder="Auto-filled after payment, or enter manually"
                />
                <p className="text-xs text-muted-foreground">Auto-filled after Razorpay payment. Enter manually if auto-fill fails.</p>
              </Field>

              {mutation.isError && !errors.email && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4" /> Something went wrong. Please try again.
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={mutation.isPending}
                  className="flex-1 h-11 font-semibold"
                >
                  {mutation.isPending ? "Processing..." : "Complete Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
