import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ExternalLink, Image, Video } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import SeverityBadge from "@/components/SeverityBadge";

const SEVERITY_POINTS = {
  "Launch Blocker": 15,
  "Critical": 10,
  "High": 7,
  "Medium": 4,
  "Low": 1,
};

export default function BugDetailPanel({ report, onClose }) {
  const queryClient = useQueryClient();
  const [severity, setSeverity] = useState(report?.severity || "");
  const [points, setPoints] = useState(report?.points_awarded || 0);
  const [notes, setNotes] = useState(report?.marshal_notes || "");
  const [duplicateOf, setDuplicateOf] = useState(report?.duplicate_of || "");

  useEffect(() => {
    setSeverity(report?.severity || "");
    setPoints(report?.points_awarded || 0);
    setNotes(report?.marshal_notes || "");
    setDuplicateOf(report?.duplicate_of || "");
  }, [report]);

  const handleSeverityChange = (val) => {
    setSeverity(val);
    setPoints(SEVERITY_POINTS[val] || 0);
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.BugReport.update(report.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allBugReports"] });
      onClose();
    },
  });

  const save = () => {
    updateMutation.mutate({
      severity,
      points_awarded: points,
      marshal_notes: notes,
      duplicate_of: duplicateOf,
    });
  };

  if (!report) return null;

  return (
    <div className="h-full flex flex-col bg-card border-l">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <span className="font-mono text-xs text-muted-foreground">#{report.id?.slice(-8)}</span>
          <h3 className="font-semibold text-sm">{report.bug_title}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="flex items-center gap-2">
          <StatusBadge status={report.status} />
          <SeverityBadge severity={report.severity} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Participant</span>
            <p className="font-medium">{report.participant_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Module</span>
            <p className="font-medium">{report.module}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Submitted</span>
            <p className="font-medium">{new Date(report.created_date).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs font-semibold">Steps to Reproduce</span>
            <p className="mt-1 bg-muted/50 rounded-lg p-3">{report.steps_to_reproduce}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-semibold">Expected Behavior</span>
            <p className="mt-1 bg-muted/50 rounded-lg p-3">{report.expected_behavior}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-semibold">Actual Behavior</span>
            <p className="mt-1 bg-muted/50 rounded-lg p-3">{report.actual_behavior}</p>
          </div>
        </div>

        {/* Media */}
        <div className="space-y-2">
          {report.screenshot_url && (
            <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Image className="w-4 h-4" /> View Screenshot <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {report.screenshot_url && (
            <img src={report.screenshot_url} alt="Screenshot" className="rounded-lg border max-h-48 object-contain w-full" />
          )}
          {report.screen_recording_url && (
            <a href={report.screen_recording_url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Video className="w-4 h-4" /> View Recording <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <hr />

        {/* Marshal controls */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Marshal Actions</h4>

          <div className="space-y-2">
            <Label className="text-xs">Severity</Label>
            <Select value={severity} onValueChange={handleSeverityChange}>
              <SelectTrigger><SelectValue placeholder="Set severity" /></SelectTrigger>
              <SelectContent>
                {Object.keys(SEVERITY_POINTS).map((s) => (
                  <SelectItem key={s} value={s}>{s} ({SEVERITY_POINTS[s]} pts)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Points Awarded</Label>
            <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} min={0} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Marshal Notes (visible to participant on "Needs More Info")</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add internal notes..." />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Duplicate Of (Report ID)</Label>
            <Input value={duplicateOf} onChange={(e) => setDuplicateOf(e.target.value)} placeholder="e.g. abc123" />
          </div>

          <Button onClick={save} disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}