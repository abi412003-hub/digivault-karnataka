import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpFromLine, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const defaultDocs = [
  "Sale Deed / Registered Deed",
  "Mother Deed / Parent Deed",
  "Gift Deed / Partition Deed / Will",
  "Latest Property Tax Receipt",
  "Electricity / BESCOM Connection ID",
  "Property Survey Sketch / Layout Plan",
  "Utility Bill / Address Proof",
  "Property Photographs",
  "No Objection Certificate (NOC)",
  "Encumbrance Certificate (EC)",
];

interface DocState {
  label: string;
  file: File | null;
  isNA: boolean;
}

const ServiceDocs = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [saving, setSaving] = useState(false);

  const [docs, setDocs] = useState<DocState[]>(
    defaultDocs.map((label) => ({ label, file: null, isNA: false }))
  );

  const toggleNA = (idx: number) => {
    setDocs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], isNA: !next[idx].isNA, file: next[idx].isNA ? next[idx].file : null };
      return next;
    });
  };

  const handleFile = (idx: number, file: File | null) => {
    setDocs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], file, isNA: false };
      return next;
    });
  };

  const removeFile = (idx: number) => {
    setDocs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], file: null };
      return next;
    });
  };

  const saveDocuments = async (andSubmit: boolean) => {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      await Promise.allSettled(
        docs.map((doc) =>
          createRecord("DigiVault Client Document", {
            document_title: doc.label,
            client: auth.client_id,
            service_request: srId,
            document_category: "Service-Specific",
            document_type_label: doc.label,
            document_file: doc.file ? doc.file.name : "",
            is_na: doc.isNA ? 1 : 0,
            document_status: doc.file ? "Uploaded" : "Pending",
            document_date: today,
          })
        )
      );
      toast({ title: andSubmit ? "Documents saved & submitted!" : "Documents saved" });
      if (andSubmit) {
        navigate(`/service-request/${encodeURIComponent(srId!)}/doc-cards`, { replace: true });
      }
    } catch {
      toast({ title: "Failed to save documents", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* header */}
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-11">Service Documents</h1>
      </div>

      {/* Sub service pill */}
      <div className="px-4 pt-4 flex justify-center">
        <span className="px-4 py-1.5 rounded-full bg-[hsl(217_91%_93%)] text-[hsl(217_91%_53%)] text-xs font-semibold">
          Required Documents
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 space-y-5">
        {docs.map((doc, idx) => (
          <div key={doc.label} className="space-y-1.5">
            <label className="text-sm font-bold text-primary">{doc.label}</label>
            <div className="flex gap-2 items-center">
              {/* filename display */}
              <div className="flex-1 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground truncate min-h-[44px] flex items-center gap-2">
                <span className="truncate flex-1">
                  {doc.file ? doc.file.name : doc.isNA ? "Not Available" : "No file selected"}
                </span>
                {doc.file && (
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Eye size={16} className="text-primary cursor-pointer" />
                    <Trash2 size={16} className="text-destructive cursor-pointer" onClick={() => removeFile(idx)} />
                  </span>
                )}
              </div>

              {/* NA button */}
              <button
                onClick={() => toggleNA(idx)}
                disabled={!!doc.file}
                className={`h-11 px-2.5 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  doc.isNA
                    ? "bg-[hsl(217_91%_53%)] text-white"
                    : "bg-muted text-muted-foreground"
                } ${doc.file ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                Not Available
              </button>

              {/* upload button */}
              <input
                ref={(el) => { fileRefs.current[idx] = el; }}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleFile(idx, e.target.files?.[0] || null)}
              />
              <button
                onClick={() => !doc.isNA && fileRefs.current[idx]?.click()}
                disabled={doc.isNA}
                className={`w-11 h-11 rounded-lg border border-input flex items-center justify-center flex-shrink-0 ${
                  doc.isNA ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <ArrowUpFromLine size={18} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 flex gap-3">
        <Button className="flex-1 h-12" onClick={() => saveDocuments(false)} disabled={saving}>
          Save
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12 border-primary text-primary"
          onClick={() => saveDocuments(true)}
          disabled={saving}
        >
          Save & Submit
        </Button>
      </div>
    </div>
  );
};

export default ServiceDocs;
