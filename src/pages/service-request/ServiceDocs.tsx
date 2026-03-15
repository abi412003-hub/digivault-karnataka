import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpFromLine, Eye, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord, fetchOne } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const fallbackDocs = [
  "Sale Deed / Registered Deed",
  "Mother Deed / Parent Deed",
  "Gift Deed / Partition Deed / Will",
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
  const [serviceName, setServiceName] = useState("");
  const [previewModal, setPreviewModal] = useState<{ url: string; name: string } | null>(null);

  const [docs, setDocs] = useState<DocState[]>(
    fallbackDocs.map((label) => ({ label, file: null, previewUrl: null, isNA: false, isMandatory: true }))
  );

  useEffect(() => {
    if (!srId) return;
    fetchOne("DigiVault Service Request", srId)
      .then(async (sr) => {
        const mainService = sr?.main_service || "";
        setServiceName(mainService);
        if (!mainService) { setLoading(false); return; }
        const svcData = await fetchOne("DigiVault Service", mainService);
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

  const openPreview = useCallback((doc: DocState) => {
    if (doc.previewUrl) {
      setPreviewModal({ url: doc.previewUrl, name: doc.file?.name || doc.label });
    }
  }, []);

  // Stats
  const uploadedCount = docs.filter((d) => d.file).length;
  const naCount = docs.filter((d) => d.isNA).length;
  const pendingCount = docs.filter((d) => !d.file && !d.isNA).length;
  const totalCount = docs.length;

  const saveDocuments = async (andSubmit: boolean) => {
    // Check all docs are either uploaded or marked NA
    if (andSubmit && pendingCount > 0) {
      toast({ title: `${pendingCount} documents still pending — upload or mark as Not Available`, variant: "destructive" });
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

      // Store NA docs in localStorage so the next page can create SRs for them
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
      {/* header */}
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-11">Service Documents</h1>
      </div>

      {/* Service name + progress */}
      <div className="px-4 pt-4 space-y-3">
        <div className="flex justify-center">
          <span className="px-4 py-1.5 rounded-full bg-[hsl(217_91%_93%)] text-[hsl(217_91%_53%)] text-xs font-semibold">
            {serviceName || "Required Documents"}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{uploadedCount + naCount} / {totalCount} completed</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> {uploadedCount} uploaded
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> {naCount} N/A
              </span>
              {pendingCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-300" /> {pendingCount} pending
                </span>
              )}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${totalCount > 0 ? ((uploadedCount + naCount) / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-32 space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))
        ) : (
          docs.map((doc, idx) => (
            <div key={`${doc.label}-${idx}`} className={`rounded-xl border p-3 space-y-2 transition-colors ${
              doc.file ? "border-green-300 bg-green-50/50" : doc.isNA ? "border-amber-300 bg-amber-50/50" : "border-border"
            }`}>
              {/* Label row with status icon */}
              <div className="flex items-center gap-2">
                {doc.file ? (
                  <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                ) : doc.isNA ? (
                  <XCircle size={18} className="text-amber-600 flex-shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-muted-foreground flex-shrink-0" />
                )}
                <span className={`text-sm font-semibold flex-1 ${doc.file ? "text-green-800" : doc.isNA ? "text-amber-800" : "text-foreground"}`}>
                  {doc.label}
                </span>
                {doc.isMandatory && (
                  <span className="text-[10px] font-bold text-destructive bg-red-50 px-1.5 py-0.5 rounded">Required</span>
                )}
              </div>

              {/* File info + actions row */}
              <div className="flex gap-2 items-center">
                <div className={`flex-1 rounded-lg px-3 py-2 text-sm truncate min-h-[40px] flex items-center ${
                  doc.file ? "bg-green-100/60 text-green-800" : doc.isNA ? "bg-amber-100/60 text-amber-700" : "bg-muted text-muted-foreground"
                }`}>
                  {doc.file ? (
                    <span className="truncate flex-1">{doc.file.name}</span>
                  ) : doc.isNA ? (
                    <span className="italic">Marked as Not Available</span>
                  ) : (
                    <span>No file selected</span>
                  )}
                </div>

                {/* Preview button — only when file is uploaded */}
                {doc.file && (
                  <button
                    onClick={() => openPreview(doc)}
                    className="w-10 h-10 rounded-lg border border-green-300 bg-green-50 flex items-center justify-center flex-shrink-0"
                    title="Preview"
                  >
                    <Eye size={18} className="text-green-700" />
                  </button>
                )}

                {/* Delete button — only when file is uploaded */}
                {doc.file && (
                  <button
                    onClick={() => removeFile(idx)}
                    className="w-10 h-10 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center flex-shrink-0"
                    title="Remove"
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </button>
                )}

                {/* NA toggle — only when no file */}
                {!doc.file && (
                  <button
                    onClick={() => toggleNA(idx)}
                    className={`h-10 px-2.5 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                      doc.isNA
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    N/A
                  </button>
                )}

                {/* Upload button — only when not NA */}
                {!doc.isNA && !doc.file && (
                  <>
                    <input
                      ref={(el) => { fileRefs.current[idx] = el; }}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFile(idx, e.target.files?.[0] || null)}
                    />
                    <button
                      onClick={() => fileRefs.current[idx]?.click()}
                      className="w-10 h-10 rounded-lg border border-primary bg-primary/5 flex items-center justify-center flex-shrink-0"
                      title="Upload"
                    >
                      <ArrowUpFromLine size={18} className="text-primary" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}

        {/* NA docs notice */}
        {naCount > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1.5">
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <AlertCircle size={16} />
              {naCount} document{naCount > 1 ? "s" : ""} marked as Not Available
            </p>
            <p className="text-xs text-amber-700">
              A separate service request will be created for each unavailable document to help you obtain them.
            </p>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 space-y-2">
        {/* Summary */}
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-600" /> {uploadedCount} uploaded</span>
          {naCount > 0 && <span className="flex items-center gap-1"><XCircle size={12} className="text-amber-500" /> {naCount} not available</span>}
          {pendingCount > 0 && <span className="text-destructive">{pendingCount} still pending</span>}
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 h-12" onClick={() => saveDocuments(false)} disabled={saving}>
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            className="flex-1 h-12 bg-primary"
            onClick={() => saveDocuments(true)}
            disabled={saving || pendingCount > 0}
          >
            {naCount > 0 ? `Submit & Create ${naCount} SR${naCount > 1 ? "s" : ""}` : "Submit All"}
          </Button>
        </div>
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
              {previewModal.url.match(/\.pdf$/i) ? (
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
