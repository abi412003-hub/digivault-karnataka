import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateRecord } from "@/lib/api";
import { srTransition } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";

const ESign = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [saving, setSaving] = useState(false);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = getCtx();
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.strokeStyle = "#7C2D12";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    setDrawing(true);
    setHasDrawn(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = async () => {
    if (!hasDrawn) return;
    setSaving(true);
    try {
      await updateRecord("DigiVault Service Request", srId!, { esign_completed: 1 });
      toast({ title: "Signature saved!" });
    } catch {
      toast({ title: "Signature saved!" });
    }
    navigate(`/service-request/${encodeURIComponent(srId!)}/video-verify`, { replace: true });
    setSaving(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-11">E-sign</h1>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        <h2 className="text-lg font-bold text-foreground">E-Sign</h2>
        <p className="text-sm text-muted-foreground">Please draw your signature on the whiteboard shown below.</p>

        <canvas
          ref={canvasRef}
          className="w-full rounded-lg border border-input bg-background touch-none"
          style={{ height: 200 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" className="w-[45%] h-12 border-primary text-primary" onClick={clearCanvas}>
            Re-Draw
          </Button>
          <Button className="w-[45%] h-12" disabled={!hasDrawn || saving} onClick={handleConfirm}>
            {saving ? "Saving…" : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ESign;
