import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpFromLine, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchOne } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface UploadPair {
  front: File | null;
  back: File | null;
}

const sections = [
  { name: "Proof of identity", mandatory: true },
  { name: "Proof of Address", mandatory: true },
  { name: "DOB Certificate", mandatory: false },
];

const CommonDocs = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mainService, setMainService] = useState("");
  const [subService, setSubService] = useState("");
  const [uploads, setUploads] = useState<UploadPair[]>(sections.map(() => ({ front: null, back: null })));
  const frontRefs = useRef<(HTMLInputElement | null)[]>([]);
  const backRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!srId) return;
    fetchOne("DigiVault Service Request", srId)
      .then((d) => {
        setMainService(d?.main_service || "E-katha");
        setSubService(d?.sub_service || "New E-Katha Registration");
      })
      .catch(() => {
        setMainService("E-katha");
        setSubService("New E-Katha Registration");
      });
  }, [srId]);

  const handleFile = (sectionIdx: number, side: "front" | "back", file: File | null) => {
    setUploads((prev) => {
      const next = [...prev];
      next[sectionIdx] = { ...next[sectionIdx], [side]: file };
      return next;
    });
  };

  const mandatoryCount = sections.filter((s) => s.mandatory).length;
  const mandatoryUploaded = sections.filter((s, i) => s.mandatory && uploads[i].front).length;

  const handleNext = () => {
    if (mandatoryUploaded < mandatoryCount) {
      toast({ title: `Please upload all mandatory documents (${mandatoryUploaded}/${mandatoryCount})`, variant: "destructive" });
      return;
    }
    navigate(`/service-request/${encodeURIComponent(srId!)}/service-docs`, { replace: true });
  };

  const UploadBtn = ({ label, file, onClick }: { label: string; file: File | null; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-between rounded-lg border border-input bg-background px-3 py-3 min-h-[44px] text-sm"
    >
      {file ? (
        <span className="flex items-center gap-1.5 text-[hsl(142_76%_36%)] truncate">
          <CheckCircle size={16} />
          <span className="truncate">{file.name}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">{label}</span>
      )}
      <ArrowUpFromLine size={16} className="text-muted-foreground flex-shrink-0 ml-2" />
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 space-y-5">
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="bg-secondary px-4 py-3">
            <h2 className="text-center font-bold text-foreground text-lg">Upload Common Documents</h2>
          </div>
          <div className="bg-background px-4 py-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-bold text-foreground">Main Service</span>
              <span className="text-sm text-muted-foreground">{mainService}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-bold text-foreground">Sub Service</span>
              <span className="text-sm text-muted-foreground">{subService}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{mandatoryUploaded}/{mandatoryCount} mandatory documents uploaded</p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${mandatoryCount ? (mandatoryUploaded / mandatoryCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {sections.map((section, idx) => (
          <div key={section.name} className="space-y-2">
            <label className="text-sm font-bold text-primary">
              {section.name}
              {section.mandatory ? (
                <span className="text-destructive ml-1">*</span>
              ) : (
                <span className="text-muted-foreground text-xs font-normal ml-1">(optional)</span>
              )}
            </label>
            <div className="flex gap-3">
              <input
                ref={(el) => { frontRefs.current[idx] = el; }}
                type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => handleFile(idx, "front", e.target.files?.[0] || null)}
              />
              <input
                ref={(el) => { backRefs.current[idx] = el; }}
                type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => handleFile(idx, "back", e.target.files?.[0] || null)}
              />
              <UploadBtn label="Upload Front Side" file={uploads[idx].front} onClick={() => frontRefs.current[idx]?.click()} />
              <UploadBtn label="Upload Back Side" file={uploads[idx].back} onClick={() => backRefs.current[idx]?.click()} />
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4">
        <Button className="w-full h-12" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default CommonDocs;
