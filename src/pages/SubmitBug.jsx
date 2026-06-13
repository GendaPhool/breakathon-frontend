import { useState } from "react";
import { entities, uploadFile } from "@/api/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Bug, CheckCircle2, ImagePlus, Video, Clock } from "lucide-react";
import DuplicateAwarenessList from "@/components/DuplicateAwarenessList";
import ParticipantGateWrapper from "@/components/ParticipantGateWrapper";
import { useParticipantSession } from "@/components/ParticipantSessionProvider";

const MODULES = [
  "Customer App", "Admin Dashboard", "Delivery Partner App",
  "Production Dashboard", "Route Management", "Subscription Management",
  "Payment System", "Wallet System", "Notification System",
];

function SubmitBugForm() {
  const { session: pSession } = useParticipantSession();
  const [form, setForm] = useState({
    module: "", bug_title: "", steps_to_reproduce: "",
    expected_behavior: "", actual_behavior: "",
  });
  const [screenshotFile,    setScreenshotFile]    = useState(null);
  const [recordingFile,     setRecordingFile]     = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [submitted,  setSubmitted]  = useState(null);
  const [uploading,  setUploading]  = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["eventSettings"],
    queryFn: async () => {
      const list = await entities.EventSettings.list();
      return list[0] || {};
    },
  });

  const handleFile = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "screenshot") {
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    } else {
      setRecordingFile(file);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const { file_url: screenshot_url } = await uploadFile(screenshotFile);
      let screen_recording_url = "";
      if (recordingFile) {
        const res = await uploadFile(recordingFile);
        screen_recording_url = res.file_url;
      }
      setUploading(false);
      return entities.BugReport.create({
        ...form,
        screenshot_url,
        screen_recording_url,
        participant_id:   pSession.participant_id,
        participant_name: pSession.name,
        status:           "Pending Review",
        points_awarded:   0,
        is_confirming_duplicate: false,
      });
    },
    onSuccess: (data) => setSubmitted(data),
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const canSubmit =
    form.module && form.bug_title && form.steps_to_reproduce &&
    form.expected_behavior && form.actual_behavior &&
    screenshotFile && duplicateConfirmed && !mutation.isPending;

  if (settings?.event_started === false) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-sm w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold">Event Hasn't Started Yet</h2>
            <p className="text-sm text-muted-foreground">Bug submissions will open once the marshal starts the event.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-display font-bold">Bug Reported!</h2>
            <p className="text-muted-foreground text-sm">
              Report ID: <span className="font-mono font-semibold text-foreground">#{submitted.id?.slice(-8)}</span>
            </p>
            <p className="text-sm text-muted-foreground">Your report is under review</p>
            <Button onClick={() => {
              setSubmitted(null);
              setForm({ module: "", bug_title: "", steps_to_reproduce: "", expected_behavior: "", actual_behavior: "" });
              setScreenshotFile(null); setRecordingFile(null); setScreenshotPreview(null); setDuplicateConfirmed(false);
            }}>
              Submit Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Bug className="w-6 h-6 text-primary" /> Report a Bug
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Submitting as <span className="font-semibold text-primary">{pSession?.participant_id}</span> — {pSession?.name}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <Label>Module *</Label>
            <Select value={form.module} onValueChange={(v) => { update("module", v); setDuplicateConfirmed(false); }}>
              <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
              <SelectContent>{MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <DuplicateAwarenessList module={form.module} confirmed={duplicateConfirmed} onConfirm={setDuplicateConfirmed} />

          <div className="space-y-2">
            <Label>Bug Title * <span className="text-muted-foreground text-xs">({form.bug_title.length}/100)</span></Label>
            <Input value={form.bug_title} onChange={(e) => update("bug_title", e.target.value.slice(0, 100))} placeholder="Short description of the bug" />
          </div>
          <div className="space-y-2">
            <Label>Steps to Reproduce * <span className="text-muted-foreground text-xs">({form.steps_to_reproduce.length}/300)</span></Label>
            <Textarea value={form.steps_to_reproduce} onChange={(e) => update("steps_to_reproduce", e.target.value.slice(0, 300))} placeholder="1. Go to... 2. Click on... 3. See error..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Expected Behavior * <span className="text-muted-foreground text-xs">({form.expected_behavior.length}/200)</span></Label>
            <Textarea value={form.expected_behavior} onChange={(e) => update("expected_behavior", e.target.value.slice(0, 200))} placeholder="What should have happened?" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Actual Behavior * <span className="text-muted-foreground text-xs">({form.actual_behavior.length}/200)</span></Label>
            <Textarea value={form.actual_behavior} onChange={(e) => update("actual_behavior", e.target.value.slice(0, 200))} placeholder="What actually happened?" rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Screenshot * <span className="text-xs text-destructive">(Required)</span></Label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
              {screenshotPreview
                ? <img src={screenshotPreview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
                : <><ImagePlus className="w-8 h-8 text-muted-foreground mb-2" /><span className="text-sm text-muted-foreground">Tap to upload screenshot</span></>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, "screenshot")} />
            </label>
          </div>

          <div className="space-y-2">
            <Label>Screen Recording <span className="text-xs text-muted-foreground">(Optional)</span></Label>
            <label className="flex items-center gap-3 border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors">
              <Video className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{recordingFile ? recordingFile.name : "Tap to upload recording"}</span>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e, "recording")} />
            </label>
          </div>

          <Button onClick={() => mutation.mutate()} disabled={!canSubmit} className="w-full h-12 text-base font-semibold">
            {uploading ? "Uploading files..." : mutation.isPending ? "Submitting..." : "Submit Bug Report"}
          </Button>
          {!screenshotFile && form.module && <p className="text-xs text-destructive text-center">Screenshot is required to submit</p>}
          {form.module && !duplicateConfirmed && <p className="text-xs text-amber-600 text-center">Please confirm this is not a duplicate</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubmitBug() {
  return <ParticipantGateWrapper><SubmitBugForm /></ParticipantGateWrapper>;
}
