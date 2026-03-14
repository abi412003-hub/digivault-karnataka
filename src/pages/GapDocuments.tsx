import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  AlertTriangle,
  Info,
  ShieldCheck,
} from "lucide-react";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList, fetchOne, uploadFile, createRecord, updateRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface GapFile {
  name: string;
  document_name: string;
  file_status: string;
  remark: string;
  file_attachment: string;
}

const GapDocuments = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [gapName, setGapName] = useState("");
  const [gapStatus, setGapStatus] = useState("");
  const [gapRemarks, setGapRemarks] = useState("");
  const [files, setFiles] = useState<GapFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeDocRef = useRef<string>("");

  useEffect(() => {
    if (!auth.client_id) return;

    const load = async () => {
      try {
        const gaps = await fetchList(
          "DigiVault GAP Analysis",
          ["name"],
          [["client", "=", auth.client_id]],
          1,
          "creation desc"
        );
        if (!gaps?.length) { setLoading(false); return; }

        const gap = await fetchOne("DigiVault GAP Analysis", gaps[0].name);
        if (gap) {
          setGapName(gap.name);
          setGapStatus(gap.gap_status || "Pending");
          setGapRemarks(gap.remarks || "");
          setFiles(gap.gap_files || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [auth.client_id]);

  const handleUploadClick = (docName: string) => {
    activeDocRef.current = docName;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gapName) return;
    e.target.value = "";

    const docName = activeDocRef.current;
    setUploading(docName);
    setUploadProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 85));
      }, 300);

      // 1. Upload file via proxy
      const uploadRes = await uploadFile(file, "DigiVault GAP Analysis", gapName, "file_attachment");
      setUploadProgress(90);

      const fileUrl = uploadRes?.message?.file_url || "";

      // 2. Create a DigiVault Client Document record
      await createRecord("DigiVault Client Document", {
        document_title: docName,
        client: auth.client_id,
        document_status: "Uploaded",
        document_file: fileUrl,
      });

      // 3. Update the GAP File child row status
      const gapFile = files.find((f) => f.document_name === docName);
      if (gapFile?.name) {
        await updateRecord("GAP File", gapFile.name, { file_status: "Uploaded", file_attachment: fileUrl });
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update local state
      setFiles((prev) =>
        prev.map((f) =>
          f.document_name === docName ? { ...f, file_status: "Uploaded", file_attachment: fileUrl } : f
        )
      );

      toast({ title: "Uploaded", description: `${docName} uploaded successfully` });
    } catch {
      toast({ title: "Upload failed", description: "Please try again", variant: "destructive" });
    } finally {
      setTimeout(() => {
        setUploading(null);
        setUploadProgress(0);
      }, 500);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "Verified": return <CheckCircle2 size={20} className="text-[hsl(var(--success))]" />;
      case "Rejected": return <XCircle size={20} className="text-destructive" />;
      case "Missing": return <Clock size={20} className="text-[hsl(var(--warning))]" />;
      case "Uploaded": return <Upload size={20} className="text-primary" />;
      default: return <Clock size={20} className="text-muted-foreground" />;
    }
  };

  const bannerConfig: Record<string, { bg: string; text: string; icon: typeof Info; label: string }> = {
    Pending: { bg: "bg-[hsl(48_96%_89%)]", text: "text-[hsl(38_92%_50%)]", icon: Info, label: "Your documents are under review" },
    Rejected: { bg: "bg-[hsl(0_93%_94%)]", text: "text-[hsl(0_72%_51%)]", icon: AlertTriangle, label: "Some documents need attention — please re-upload" },
    Approved: { bg: "bg-[hsl(142_76%_90%)]", text: "text-[hsl(142_76%_36%)]", icon: ShieldCheck, label: "All documents verified" },
  };

  const banner = bannerConfig[gapStatus] || bannerConfig.Pending;
  const BannerIcon = banner.icon;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Required Documents</h1>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-16">Loading…</p>
      ) : !gapName ? (
        <p className="text-sm text-muted-foreground text-center py-16">No GAP analysis found</p>
      ) : (
        <div className="px-4 space-y-4">
          {/* Status Banner */}
          <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${banner.bg}`}>
            <BannerIcon size={20} className={banner.text} />
            <p className={`text-sm font-medium ${banner.text}`}>{banner.label}</p>
          </div>

          {gapRemarks && (
            <p className="text-xs text-muted-foreground px-1">{gapRemarks}</p>
          )}

          {/* Document List */}
          <div className="space-y-3">
            {files.map((f) => {
              const isUploading = uploading === f.document_name;

              return (
                <div key={f.name || f.document_name} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    {statusIcon(f.file_status)}
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {f.document_name}
                    </span>
                  </div>

                  {isUploading && (
                    <div className="mt-3">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-[10px] text-muted-foreground mt-1">Uploading… {uploadProgress}%</p>
                    </div>
                  )}

                  {f.file_status === "Rejected" && (
                    <div className="mt-2 space-y-2">
                      {f.remark && (
                        <p className="text-xs text-destructive">{f.remark}</p>
                      )}
                      <button
                        onClick={() => handleUploadClick(f.document_name)}
                        disabled={!!uploading}
                        className="h-8 px-4 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold disabled:opacity-50"
                      >
                        Re-upload
                      </button>
                    </div>
                  )}

                  {f.file_status === "Missing" && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleUploadClick(f.document_name)}
                        disabled={!!uploading}
                        className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                      >
                        Upload
                      </button>
                    </div>
                  )}

                  {f.file_status === "Uploaded" && !isUploading && (
                    <p className="text-xs text-muted-foreground mt-2">Waiting for review</p>
                  )}

                  {f.file_status === "Verified" && (
                    <p className="text-xs text-[hsl(var(--success))] mt-2">Verified ✓</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BottomTabs />
    </div>
  );
};

export default GapDocuments;
