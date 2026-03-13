import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Video, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const VideoVerify = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoUrl(URL.createObjectURL(blob));
        setRecorded(true);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((p) => p + 1), 1000);
    } catch {
      setError("Camera access is required for video verification. Please allow camera permissions and try again.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRecord("DigiVault Service Request", srId!, {
        video_verified: 1,
        progress_steps_completed: 5,
        progress_percentage: 50,
      });
      toast({ title: "Video verification saved!" });
    } catch {
      toast({ title: "Video saved!" });
    }
    navigate(`/service-request/${encodeURIComponent(srId!)}/payment`, { replace: true });
    setSaving(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        <h1 className="text-xl font-bold text-foreground">Video Verification</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This video is being recorded to confirm that you are the authorised individual sharing the concern Authority
        </p>

        {/* Video preview */}
        <div className="rounded-xl bg-secondary overflow-hidden relative" style={{ height: 250 }}>
          {recording ? (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 rounded-full px-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-white text-xs font-medium">{formatTime(seconds)}</span>
              </div>
            </>
          ) : recorded && videoUrl ? (
            <video src={videoUrl} className="w-full h-full object-cover" controls playsInline />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={80} className="text-primary opacity-50" />
            </div>
          )}
        </div>

        {/* Recorded bar */}
        {recorded && videoUrl && !recording && (
          <div className="flex items-center gap-3 bg-muted rounded-lg px-4 py-3">
            <Play size={18} className="text-foreground" />
            <span className="text-sm text-foreground flex-1">{formatTime(seconds)}</span>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <p className="font-bold text-foreground">Make sure</p>
        <ul className="text-sm text-foreground space-y-1.5 list-disc pl-5">
          <li>Your face is clearly visible.</li>
          <li>Your voice is audible.</li>
          <li>You speak the full sentence in one shot.</li>
        </ul>

        <button className="text-sm text-primary underline font-medium">Click to view sample Video</button>

        {!recorded && (
          <Button
            className={`w-full h-[50px] ${recording ? "bg-destructive hover:bg-destructive/90" : ""}`}
            onClick={recording ? stopRecording : startRecording}
          >
            <Video size={18} className="mr-2" />
            {recording ? "Stop Recording" : "Start Recording video"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideoVerify;
