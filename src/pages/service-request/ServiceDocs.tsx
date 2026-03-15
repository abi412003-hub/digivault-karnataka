import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Download, XCircle, Upload, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord, fetchOne } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const fallbackDocs = [
  "Sale Deed / Registered Deed",
  "Mother Deed / Parent Deed",
  "Application Form",
  "Latest Property Tax Receipt",
  "Encumbrance Certificate (EC)",
];

interface DocState {
  label: string;
  file: File | null;
  previewUrl: string | null;
  isNA: boolean;
  isMandatory: boolean;
}

const ServiceDocs = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mainService, setMainService] = useState("");
  const [subService, setSubService] = useState("");
  const [previewModal, setPreviewModal] = useState<{ url: string; name: string } | null>(null);

  const [docs, setDocs] = useState<DocState[]>(
    fallbackDocs.map((label) => ({ label, file: null, previewUrl: null, isNA: false, isMandatory: true }))
  );

  useEffect(() => {
    if (!srId) return;
    fetchOne("DigiVault Service Request", srId)
      .then(async (sr) => {
        const ms = sr?.main_service || "";
        const ss = sr?.sub_service || "";
        setMainService(ms);
        setSubService(ss);
        if (!ms) { setLoading(false); return; }
        const svcData = await fetchOne("DigiVault Service", ms);
        const reqDocs = svcData?.required_documents || [];
        if (reqDocs.length > 0) {
          setDocs(
            reqDocs.map((d: { document_title: string; is_mandatory: number }) => ({
              label: d.document_title || "Document",
              file: null,
              previewUrl: null,
              isNA: false,
              isMandatory: d.is_mandatory === 1,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [srId]);

  const toggleNA = (idx: number) => {
    setDocs((prev) => {
      const next = [...prev];
      const wasNA = next[idx].isNA;
      next[idx] = { ...next[idx], isNA: !wasNA, file: wasNA ? next[idx].file : null, previewUrl: wasNA ? next[idx].previewUrl : null };
      return next;
    });
  };

  const handleFile = (idx: number, file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDocs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], file, previewUrl: url, isNA: false };
      return next;
    });
  };

  const removeFile = (idx: number) => {
    setDocs((prev) => {
      const next = [...prev];
      if (next[idx].previewUrl) URL.revokeObjectURL(next[idx].previewUrl!);
      next[idx] = { ...next[idx], file: null, previewUrl: null };
      return next;
    });
  };

  const uploadedCount = docs.filter((d) => d.file).length;
  const naCount = docs.filter((d) => d.isNA).length;
  const pendingCount = docs.filter((d) => !d.file && !d.isNA).length;

  const saveDocuments = async (andSubmit: boolean) => {
    if (andSubmit && pendingCount > 0) {
      toast({ title: `${pendingCount} documents still pending`, variant: "destructive" });
      return;
    }
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
            document_status: doc.file ? "Uploaded" : doc.isNA ? "Not Available" : "Pending",
            document_date: today,
          })
        )
      );
      const naDocs = docs.filter((d) => d.isNA).map((d) => d.label);
      if (naDocs.length > 0) {
        localStorage.setItem(`edv_na_docs_${srId}`, JSON.stringify(naDocs));
      }
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
      {/* Header */}
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
      </div>

      {/* Review Documents title */}
      <div className="px-4 pt-4 flex justify-center">
        <span className="px-6 py-2 rounded-full bg-[hsl(217_91%_93%)] text-[hsl(217_91%_53%)] text-sm font-bold">
          Review Documents
        </span>
      </div>

      {/* Service Info */}
      <div className="px-5 pt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-foreground">Main Service</span>
          <span className="text-sm text-muted-foreground">{mainService || "—"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-foreground">Sub Service</span>
          <span className="text-sm text-muted-foreground">{subService || "—"}</span>
        </div>
      </div>

      {/* Section title */}
      <div className="px-5 pt-4 pb-2 border-b border-border">
        <h2 className="text-sm font-bold text-foreground text-center">
          {subService || mainService || "Service"} Required Documents
        </h2>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-32 space-y-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))
        ) : (
          docs.map((doc, idx) => (
            <div key={`${doc.label}-${idx}`} className="space-y-1.5">
              {/* Document label */}
              <label className="text-sm font-bold text-foreground">{doc.label}</label>

              {/* Upload row — matches screenshot design */}
              <div className="flex items-center gap-2">
                {/* File input display */}
                <div
                  onClick={() => !doc.file && !doc.isNA && fileRefs.current[idx]?.click()}
                  className={`flex-1 h-11 rounded-lg border px-3 flex items-center gap-2 text-sm cursor-pointer ${
                    doc.file
                      ? "border-green-400 bg-green-50/50"
                      : doc.isNA
                      ? "border-amber-300 bg-amber-50/30"
                      : "border-input bg-background"
                  }`}
                >
                  <span className={`truncate flex-1 ${doc.file ? "text-green-700" : doc.isNA ? "text-amber-600 italic" : "text-muted-foreground"}`}>
                    {doc.file ? doc.file.name : doc.isNA ? "Not Available" : "Upload File"}
                  </span>
                </div>

                {/* Hidden file input */}
                <input
                  ref={(el) => { fileRefs.current[idx] = el; }}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFile(idx, e.target.files?.[0] || null)}
                />

                {/* Status icon: green check if uploaded */}
                {doc.file && (
                  <button
                    onClick={() => doc.previewUrl && setPreviewModal({ url: doc.previewUrl, name: doc.file?.name || doc.label })}
                    className="w-9 h-9 rounded-full border border-green-300 bg-green-50 flex items-center justify-center flex-shrink-0"
                    title="Preview"
                  >
                    <CheckCircle size={18} className="text-green-600" />
                  </button>
                )}

                {/* Preview/Eye button when uploaded */}
                {doc.file && (
                  <button
                    onClick={() => doc.previewUrl && setPreviewModal({ url: doc.previewUrl, name: doc.file?.name || doc.label })}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center flex-shrink-0"
                    title="Preview"
                  >
                    <Eye size={16} className="text-primary" />
                  </button>
                )}

                {/* Delete button when uploaded */}
                {doc.file && (
                  <button
                    onClick={() => removeFile(idx)}
                    className="w-9 h-9 rounded-full border border-red-200 flex items-center justify-center flex-shrink-0"
                    title="Remove"
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                )}

                {/* NA button — shown when no file uploaded */}
                {!doc.file && (
                  <button
                    onClick={() => toggleNA(idx)}
                    className={`h-9 px-3 rounded-lg text-xs font-bold flex-shrink-0 transition-colors ${
                      doc.isNA
                        ? "bg-[hsl(217_91%_53%)] text-white"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    NA
                  </button>
                )}

                {/* Upload/Download icon — shown when no file and not NA */}
                {!doc.file && !doc.isNA && (
                  <button
                    onClick={() => fileRefs.current[idx]?.click()}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center flex-shrink-0"
                    title="Upload"
                  >
                    <Download size={16} className="text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom buttons — matching screenshot */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-5 py-4 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12 border-primary text-primary font-semibold"
          onClick={() => saveDocuments(false)}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          className="flex-1 h-12 font-semibold"
          onClick={() => saveDocuments(true)}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save & Submit"}
        </Button>
      </div>

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewModal(null)}>
          <div className="bg-background rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground truncate flex-1">{previewModal.name}</h3>
              <button onClick={() => setPreviewModal(null)} className="text-muted-foreground text-lg font-bold ml-2">✕</button>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[300px]">
              {previewModal.name.match(/\.pdf$/i) ? (
                <iframe src={previewModal.url} className="w-full h-[60vh] rounded" />
              ) : (
                <img src={previewModal.url} alt="Preview" className="max-w-full max-h-[60vh] rounded-lg object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDocs;
