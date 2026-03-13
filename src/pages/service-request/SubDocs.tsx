import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpFromLine, Eye, Trash2, Table } from "lucide-react";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOne, fetchList, createRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const SUB_DOCS: Record<string, string[]> = {
  EC: [
    "Original Encumbrance Certificate (EC)",
    "Application Records",
    "Registration Records",
    "Mutation Entries",
    "Previous Encumbrance Certificates",
    "Property Details",
    "Owner/Assessee Details",
    "Legal References",
    "Payment Receipts",
  ],
  NOC: [
    "Original NOC",
    "Application Form",
    "Property Ownership Proof",
    "Site Plan",
    "Previous Approvals",
  ],
};

const GENERIC = ["Original Document", "Supporting Documents", "Application Records"];

const ProgressRing = ({ percentage, size = 48 }: { percentage: number; size?: number }) => {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(38 92% 50%)" strokeWidth={stroke} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-white text-[10px] font-bold" transform={`rotate(90 ${size / 2} ${size / 2})`}>{percentage}%</text>
    </svg>
  );
};

interface DocRow {
  label: string;
  file: File | null;
  fileName: string;
  isNA: boolean;
}

const SubDocs = () => {
  const { srId, docName } = useParams<{ srId: string; docName: string }>();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();

  const [sr, setSr] = useState<any>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (srId) {
      fetchOne("DigiVault Service Request", srId).then(setSr).catch(() => {});
    }
  }, [srId]);

  useEffect(() => {
    const decoded = decodeURIComponent(docName || "");
    // Try API first
    if (sr?.main_service) {
      fetchList("DigiVault Required Document Template", ["name", "document_label", "service"], [["service", "=", sr.main_service]])
        .then((data: any[]) => {
          if (data?.length) {
            setDocs(data.map((d) => ({ label: d.document_label || d.name, file: null, fileName: "", isNA: false })));
          } else {
            loadFallback(decoded);
          }
        })
        .catch(() => loadFallback(decoded));
    } else {
      loadFallback(decoded);
    }
  }, [sr, docName]);

  const loadFallback = (decoded: string) => {
    const key = Object.keys(SUB_DOCS).find((k) => decoded.toLowerCase().includes(k.toLowerCase()));
    const list = key ? SUB_DOCS[key] : GENERIC;
    setDocs(list.map((label) => ({ label, file: null, fileName: "", isNA: false })));
  };

  const handleFile = (idx: number, file: File | null) => {
    setDocs((prev) => prev.map((d, i) => i === idx ? { ...d, file, fileName: file?.name || "", isNA: false } : d));
  };

  const toggleNA = (idx: number) => {
    setDocs((prev) => prev.map((d, i) => i === idx ? { ...d, isNA: !d.isNA, file: null, fileName: "" } : d));
  };

  const removeFile = (idx: number) => {
    setDocs((prev) => prev.map((d, i) => i === idx ? { ...d, file: null, fileName: "" } : d));
  };

  const handleSave = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      await Promise.all(
        docs.map((d) =>
          createRecord("DigiVault Client Document", {
            document_title: d.label,
            client: auth.client_id,
            service_request: srId,
            document_category: "Sub-Document",
            document_type_label: d.label,
            parent_document: decodeURIComponent(docName || ""),
            document_file: "",
            is_na: d.isNA ? 1 : 0,
            document_status: d.fileName ? "Uploaded" : "Pending",
            document_date: today,
          })
        )
      );
      toast({ title: "Sub-documents saved" });
      navigate(-1);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const completed = sr?.progress_steps_completed ?? 3;
  const total = sr?.progress_steps_total ?? 10;
  const pct = sr?.progress_percentage ?? 30;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-background px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Progress banner */}
        <div className="rounded-xl bg-primary p-4 flex items-center justify-between">
          <span className="text-primary-foreground font-bold text-sm flex-1 pr-3">
            {sr?.sub_service || "Service Request"}
          </span>
          <span className="bg-white/20 text-primary-foreground text-xs font-medium px-2 py-1 rounded-full mr-3">
            {completed}/{total}
          </span>
          <ProgressRing percentage={pct} />
        </div>

        {/* Heading */}
        <div className="flex items-center gap-2">
          <Table size={18} className="text-foreground" />
          <h2 className="text-base font-bold text-foreground">
            Document Upload for {decodeURIComponent(docName || "")}
          </h2>
        </div>

        {/* Sub-document rows */}
        <div className="space-y-4">
          {docs.map((doc, idx) => (
            <div key={idx}>
              <p className="text-sm font-bold text-primary mb-2">{doc.label}</p>
              {doc.fileName ? (
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2.5">
                  <span className="flex-1 text-sm text-foreground truncate">{doc.fileName}</span>
                  <button onClick={() => {}} className="text-primary"><Eye size={18} /></button>
                  <button onClick={() => removeFile(idx)} className="text-destructive"><Trash2 size={18} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
                    {doc.isNA ? "Marked N/A" : "Upload File"}
                  </div>
                  <button
                    onClick={() => toggleNA(idx)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                      doc.isNA ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    N/A
                  </button>
                  <button
                    disabled={doc.isNA}
                    onClick={() => fileInputRefs.current[idx]?.click()}
                    className="p-2.5 rounded-lg border border-border text-muted-foreground disabled:opacity-40"
                  >
                    <ArrowUpFromLine size={18} />
                  </button>
                  <input
                    ref={(el) => { fileInputRefs.current[idx] = el; }}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFile(idx, e.target.files?.[0] || null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save */}
        <button onClick={handleSave} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold">
          Save Documents
        </button>
      </div>

      <BottomTabs />
    </div>
  );
};

export default SubDocs;
