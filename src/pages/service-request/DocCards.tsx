import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList, updateRecord, fetchOne } from "@/lib/api";
import { srTransition } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";

interface DocItem {
  name: string;
  document_title: string;
  document_status: string;
  is_na: number;
  document_category?: string;
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
    "PAN Card": "Pan",
  };
  return map[title] || title.split(" ").slice(0, 2).join(" ");
};

const fallbackCommon: DocItem[] = [
  { name: "1", document_title: "PAN Card", document_status: "Uploaded", is_na: 0, document_category: "Common" },
  { name: "2", document_title: "Proof of identity", document_status: "Uploaded", is_na: 0, document_category: "Common" },
  { name: "3", document_title: "DOB Certificate", document_status: "Uploaded", is_na: 0, document_category: "Common" },
];

const fallbackRequired: DocItem[] = [
  { name: "4", document_title: "Sale Deed / Registered Deed", document_status: "Uploaded", is_na: 0, document_category: "Service-Specific" },
  { name: "5", document_title: "Mother Deed / Parent Deed", document_status: "Uploaded", is_na: 0, document_category: "Service-Specific" },
  { name: "6", document_title: "Latest Property Tax Receipt", document_status: "Uploaded", is_na: 0, document_category: "Service-Specific" },
];

const fallbackNA: DocItem[] = [
  { name: "7", document_title: "No Objection Certificate (NOC)", document_status: "Pending", is_na: 1, document_category: "Service-Specific" },
  { name: "8", document_title: "Encumbrance Certificate (EC)", document_status: "Pending", is_na: 1, document_category: "Service-Specific" },
  { name: "9", document_title: "Property Survey Sketch / Layout Plan", document_status: "Pending", is_na: 1, document_category: "Service-Specific" },
];

const DocCards = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();
  const [commonDocs, setCommonDocs] = useState<DocItem[]>(fallbackCommon);
  const [requiredDocs, setRequiredDocs] = useState<DocItem[]>(fallbackRequired);
  const [naDocs, setNaDocs] = useState<DocItem[]>(fallbackNA);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sr, setSr] = useState<any>(null);

  useEffect(() => {
    if (srId) {
      fetchOne("DigiVault Service Request", srId).then((data) => { if (data) setSr(data); }).catch(() => {});
    }
  }, [srId]);

  useEffect(() => {
    if (!auth.client_id || !srId) return;
    fetchList(
      "DigiVault Client Document",
      ["name", "document_title", "document_status", "is_na", "document_category"],
      [["service_request", "=", srId]]
    )
      .then((data: DocItem[]) => {
        if (data?.length) {
          setCommonDocs(data.filter((d) => d.document_category === "Common" && d.is_na !== 1));
          setRequiredDocs(data.filter((d) => d.document_category !== "Common" && d.is_na !== 1 && d.document_status !== "Pending"));
          setNaDocs(data.filter((d) => d.is_na === 1));
        }
      })
      .catch(() => {});
  }, [auth.client_id, srId]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const srData = await fetchOne("DigiVault Service Request", srId!);
      const completed = (srData?.progress_steps_completed || 0) + 1;
      const total = srData?.progress_steps_total || 10;
      await updateRecord("DigiVault Service Request", srId!, {
        progress_steps_completed: completed,
        progress_percentage: Math.round((completed / total) * 100),
      });
      toast({ title: "Documents submitted!" });
      // Workflow: Documents Pending → Under Review
      await srTransition("all_docs_uploaded", srId!).catch(() => {});
      navigate(`/service-request/${encodeURIComponent(srId!)}/poa`, { replace: true });
    } catch {
      toast({ title: "Submitted successfully!" });
      await srTransition("all_docs_uploaded", srId!).catch(() => {});
      navigate(`/service-request/${encodeURIComponent(srId!)}/poa`, { replace: true });
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
        <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-11">Review Documents</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 space-y-6">
        {/* Blue pill header */}
        <div className="flex justify-center">
          <span className="px-5 py-2 rounded-full bg-[hsl(217_91%_93%)] text-[hsl(217_91%_53%)] text-sm font-semibold">
            Review Documents
          </span>
        </div>

        {/* Service info */}
        {sr && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Main Service: <span className="font-medium text-foreground">{sr.main_service}</span></p>
            <p>Sub Service: <span className="font-medium text-foreground">{sr.sub_service}</span></p>
          </div>
        )}

        {/* Uploaded Documents pill */}
        <div className="flex">
          <span className="px-4 py-1.5 rounded-full bg-[hsl(217_91%_93%)] text-[hsl(217_91%_53%)] text-xs font-semibold">
            Uploaded Documents
          </span>
        </div>

        {/* Common Document */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Common Document</h3>
          <div className="grid grid-cols-3 gap-3">
            {commonDocs.map((doc) => (
              <div
                key={doc.name}
                className="rounded-xl bg-[hsl(217_91%_53%)] p-3 min-h-[80px] flex flex-col items-center justify-center gap-1 relative"
              >
                <FileText size={14} className="text-white/70 absolute top-2 right-2" />
                <span className="text-white text-[11px] font-medium text-center leading-tight">
                  {shortName(doc.document_title)}
                </span>
              </div>
            ))}
            <button className="rounded-xl border-2 border-dashed border-input min-h-[80px] flex flex-col items-center justify-center gap-1">
              <Plus size={20} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Other Documents</span>
            </button>
          </div>
        </section>

        {/* Required Document */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Required Document</h3>
          <div className="grid grid-cols-3 gap-3">
            {requiredDocs.map((doc) => (
              <div
                key={doc.name}
                className="rounded-xl bg-[hsl(217_91%_53%)] p-3 min-h-[80px] flex flex-col items-center justify-center gap-1 relative"
              >
                <FileText size={14} className="text-white/70 absolute top-2 right-2" />
                <span className="text-white text-[11px] font-medium text-center leading-tight">
                  {shortName(doc.document_title)}
                </span>
              </div>
            ))}
            <button className="rounded-xl border-2 border-dashed border-input min-h-[80px] flex flex-col items-center justify-center gap-1">
              <Plus size={20} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Other Documents</span>
            </button>
          </div>
        </section>

        {/* NA Documents */}
        {naDocs.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Not Available Documents</h3>
            <div className="grid grid-cols-3 gap-3">
              {naDocs.map((doc) => (
                <div
                  key={doc.name}
                  className="rounded-xl bg-[hsl(220_9%_46%)] p-3 min-h-[80px] flex flex-col items-center justify-center gap-1 relative"
                >
                  <FileText size={14} className="text-white/70 absolute top-2 right-2" />
                  <span className="text-white text-[11px] font-medium text-center leading-tight">
                    {shortName(doc.document_title)}
                  </span>
                </div>
              ))}
            </div>
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
