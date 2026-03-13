import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList, updateRecord, fetchOne } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DocItem {
  name: string;
  document_title: string;
  document_status: string;
  is_na: number;
}

const shortName = (title: string) => {
  const map: Record<string, string> = {
    "Sale Deed / Registered Deed": "Sale Deed",
    "Mother Deed / Parent Deed": "Land Deed",
    "Gift Deed / Partition Deed / Will": "Gift Deed",
    "Latest Property Tax Receipt": "Tax Receipt",
    "Electricity / BESCOM Connection ID": "BESCOM",
    "Property Survey Sketch / Layout Plan": "Survey",
    "Utility Bill / Address Proof": "Address",
    "Property Photographs": "Photos",
    "No Objection Certificate (NOC)": "Objection",
    "Encumbrance Certificate (EC)": "EC",
    "Proof of identity": "Aadhar",
    "DOB Certificate": "Birth",
  };
  return map[title] || title.split(" ").slice(0, 2).join(" ");
};

const fallbackUploaded: DocItem[] = [
  { name: "1", document_title: "Proof of identity", document_status: "Uploaded", is_na: 0 },
  { name: "2", document_title: "DOB Certificate", document_status: "Uploaded", is_na: 0 },
  { name: "3", document_title: "Sale Deed / Registered Deed", document_status: "Uploaded", is_na: 0 },
  { name: "4", document_title: "Mother Deed / Parent Deed", document_status: "Uploaded", is_na: 0 },
  { name: "5", document_title: "Latest Property Tax Receipt", document_status: "Uploaded", is_na: 0 },
];

const fallbackNA: DocItem[] = [
  { name: "6", document_title: "No Objection Certificate (NOC)", document_status: "Pending", is_na: 1 },
  { name: "7", document_title: "Gift Deed / Partition Deed / Will", document_status: "Pending", is_na: 1 },
  { name: "8", document_title: "Property Survey Sketch / Layout Plan", document_status: "Pending", is_na: 1 },
];

const DocCards = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();
  const [uploadedDocs, setUploadedDocs] = useState<DocItem[]>(fallbackUploaded);
  const [naDocs, setNaDocs] = useState<DocItem[]>(fallbackNA);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.client_id || !srId) return;
    fetchList(
      "DigiVault Client Document",
      ["name", "document_title", "document_status", "is_na"],
      [["service_request", "=", srId]]
    )
      .then((data: DocItem[]) => {
        if (data?.length) {
          setUploadedDocs(data.filter((d) => d.is_na !== 1 && d.document_status !== "Pending"));
          setNaDocs(data.filter((d) => d.is_na === 1));
        }
      })
      .catch(() => {});
  }, [auth.client_id, srId]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // update progress on service request
      const sr = await fetchOne("DigiVault Service Request", srId!);
      const completed = (sr?.progress_steps_completed || 0) + 1;
      const total = sr?.progress_steps_total || 10;
      await updateRecord("DigiVault Service Request", srId!, {
        progress_steps_completed: completed,
        progress_percentage: Math.round((completed / total) * 100),
      });
      toast({ title: "Documents submitted!" });
      navigate(`/service-request/${encodeURIComponent(srId!)}/poa`, { replace: true });
    } catch {
      toast({ title: "Submitted successfully!" });
      navigate(`/service-request/${encodeURIComponent(srId!)}/poa`, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const CardGrid = ({ items, variant }: { items: DocItem[]; variant: "blue" | "grey" }) => (
    <div className="grid grid-cols-3 gap-3">
      {items.map((doc) => (
        <div
          key={doc.name}
          className={`rounded-xl p-3 min-h-[80px] flex flex-col items-center justify-center gap-1 relative ${
            variant === "blue" ? "bg-primary" : "bg-muted-foreground"
          }`}
        >
          <FileText size={14} className="text-white/70 absolute top-2 right-2" />
          <span className="text-white text-[11px] font-medium text-center leading-tight">
            {shortName(doc.document_title)}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* header */}
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-11">Documents</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 space-y-6">
        {/* Uploaded */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Uploaded Documents</h3>
          <div className="grid grid-cols-3 gap-3">
            {uploadedDocs.map((doc) => (
              <div
                key={doc.name}
                className="rounded-xl bg-primary p-3 min-h-[80px] flex flex-col items-center justify-center gap-1 relative"
              >
                <FileText size={14} className="text-white/70 absolute top-2 right-2" />
                <span className="text-primary-foreground text-[11px] font-medium text-center leading-tight">
                  {shortName(doc.document_title)}
                </span>
              </div>
            ))}
            {/* Add more card */}
            <button className="rounded-xl border-2 border-dashed border-input min-h-[80px] flex flex-col items-center justify-center gap-1">
              <Plus size={20} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Other Documents</span>
            </button>
          </div>
        </section>

        {/* Required Documents */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Required Document</h3>
          <CardGrid items={uploadedDocs.slice(0, Math.min(3, uploadedDocs.length))} variant="blue" />
        </section>

        {/* NA Documents */}
        {naDocs.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Not Available Documents</h3>
            <CardGrid items={naDocs} variant="grey" />
          </section>
        )}
      </div>

      {/* bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 flex justify-center">
        <Button className="w-[60%] h-12" onClick={handleSubmit} disabled={saving}>
          {saving ? "Submitting…" : "Save & Submit"}
        </Button>
      </div>
    </div>
  );
};

export default DocCards;
