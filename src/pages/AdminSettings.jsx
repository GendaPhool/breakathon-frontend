import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities, uploadFile } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, CheckCircle2, Upload } from "lucide-react";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    event_name:            "Genda Phool Break-A-Thon",
    event_description:     "",
    event_date:            "",
    event_time:            "",
    venue:                 "",
    registration_fee:      149,
    registration_deadline: "",
    max_participants:      "",
    event_banner:          "",
    upi_id:                "",
    upi_qr_url:            "",
    registration_open:     true,
    event_started:         false,
    event_ended:           false,
    leaderboard_visible:   true,
  });
  const [saved, setSaved] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [settingsId, setSettingsId] = useState(null);

  const { data: settings } = useQuery({
    queryKey: ["eventSettings"],
    queryFn: async () => {
      const list = await entities.EventSettings.list();
      return list[0] || null;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        event_name:            settings.event_name            || "Genda Phool Break-A-Thon",
        event_description:     settings.event_description     || "",
        event_date:            settings.event_date            || "",
        event_time:            settings.event_time            || "",
        venue:                 settings.venue                 || "",
        registration_fee:      settings.registration_fee      ?? 149,
        registration_deadline: settings.registration_deadline || "",
        max_participants:      settings.max_participants       ?? "",
        event_banner:          settings.event_banner          || "",
        upi_id:                settings.upi_id                || "",
        upi_qr_url:            settings.upi_qr_url            || "",
        registration_open:     settings.registration_open     !== false,
        event_started:         settings.event_started         === true,
        event_ended:           settings.event_ended           === true,
        leaderboard_visible:   settings.leaderboard_visible   !== false,
      });
      setSettingsId(settings.id);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (settingsId) return entities.EventSettings.update(settingsId, form);
      return entities.EventSettings.create(form);
    },
    onSuccess: (data) => {
      if (!settingsId) setSettingsId(data.id);
      queryClient.invalidateQueries({ queryKey: ["eventSettings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    const { file_url } = await uploadFile(file);
    setForm((p) => ({ ...p, upi_qr_url: file_url }));
    setUploadingQr(false);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    const { file_url } = await uploadFile(file);
    setForm((p) => ({ ...p, event_banner: file_url }));
    setUploadingBanner(false);
  };

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Event Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Configure event details and controls</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Event Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Event Name</Label>
            <Input value={form.event_name} onChange={(e) => update("event_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Event Description</Label>
            <Textarea
              value={form.event_description}
              onChange={(e) => update("event_description", e.target.value)}
              placeholder="Brief description shown on the registration page"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Event Date</Label>
              <Input type="date" value={form.event_date} onChange={(e) => update("event_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Event Time</Label>
              <Input type="time" value={form.event_time} onChange={(e) => update("event_time", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Venue</Label>
            <Input value={form.venue} onChange={(e) => update("venue", e.target.value)} placeholder="e.g. Hall A, IIT Delhi" />
          </div>
          <div className="space-y-1.5">
            <Label>Event Banner Image</Label>
            <div className="flex items-center gap-3">
              {form.event_banner && (
                <img src={form.event_banner} alt="Banner" className="w-24 h-14 rounded-lg border object-cover" />
              )}
              <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 hover:bg-muted/50 text-sm transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                {uploadingBanner ? "Uploading..." : form.event_banner ? "Change Banner" : "Upload Banner"}
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={uploadingBanner} />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Registration Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Registration Fee (₹)</Label>
              <Input
                type="number"
                value={form.registration_fee}
                onChange={(e) => update("registration_fee", e.target.value)}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max Participants</Label>
              <Input
                type="number"
                value={form.max_participants}
                onChange={(e) => update("max_participants", e.target.value)}
                placeholder="Unlimited"
                min={1}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Registration Deadline</Label>
            <Input
              type="date"
              value={form.registration_deadline}
              onChange={(e) => update("registration_deadline", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Registration auto-closes after this date</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Payment Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>UPI ID</Label>
            <Input value={form.upi_id} onChange={(e) => update("upi_id", e.target.value)} placeholder="yourname@upi" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label>UPI QR Code Image</Label>
            <div className="flex items-center gap-3">
              {form.upi_qr_url && (
                <img src={form.upi_qr_url} alt="QR" className="w-16 h-16 rounded-lg border object-contain bg-white p-1" />
              )}
              <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 hover:bg-muted/50 text-sm transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                {uploadingQr ? "Uploading..." : form.upi_qr_url ? "Change QR Code" : "Upload QR Code"}
                <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} disabled={uploadingQr} />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Event Controls</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-sm">Registration Open</p>
              <p className="text-xs text-muted-foreground">When off, registration shows "Registrations Closed"</p>
            </div>
            <Switch checked={form.registration_open} onCheckedChange={(v) => update("registration_open", v)} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-sm">Event Started</p>
              <p className="text-xs text-muted-foreground">When on, checked-in participants can submit bugs</p>
            </div>
            <Switch checked={form.event_started} onCheckedChange={(v) => update("event_started", v)} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-sm">Event Ended</p>
              <p className="text-xs text-muted-foreground">When on, bug submissions are automatically closed</p>
            </div>
            <Switch checked={form.event_ended} onCheckedChange={(v) => update("event_ended", v)} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-sm">Leaderboard Visible</p>
              <p className="text-xs text-muted-foreground">When off, leaderboard is hidden from participants</p>
            </div>
            <Switch checked={form.leaderboard_visible} onCheckedChange={(v) => update("leaderboard_visible", v)} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full h-12 gap-2">
        {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saveMutation.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
