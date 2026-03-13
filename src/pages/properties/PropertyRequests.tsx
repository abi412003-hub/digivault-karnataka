import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Building2, Eye, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList, fetchOne } from "@/lib/api";

interface ServiceReq {
  name: string;
  sub_service: string;
  progress_steps_completed: number;
  progress_steps_total: number;
  progress_percentage: number;
}

interface DocItem {
  name: string;
  document_title: string;
  document_status: string;
  document_file: string;
  is_na: number;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  Completed: { bg: "bg-[hsl(142_76%_90%)]", text: "text-[hsl(142_76%_36%)]" },
  "On Going": { bg: "bg-[hsl(217_91%_93%)]", text: "text-[hsl(224_76%_48%)]" },
  Pending: { bg: "bg-[hsl(48_96%_89%)]", text: "text-[hsl(38_92%_50%)]" },
  Uploaded: { bg: "bg-[hsl(270_82%_94%)]", text: "text-[hsl(263_70%_50%)]" },
  Rejected: { bg: "bg-[hsl(0_93%_94%)]", text: "text-[hsl(0_72%_51%)]" },
};

const fallbackDocs: DocItem[] = [
  { name: "1", document_title: "Sale Deed / Registered Deed", document_status: "Completed", document_file: "", is_na: 0 },
  { name: "2", document_title: "NOC", document_status: "On Going", document_file: "", is_na: 0 },
  { name: "3", document_title: "EC", document_status: "Pending", document_file: "", is_na: 1 },
  { name: "4", document_title: "Mother Deed / Parent Deed", document_status: "Uploaded", document_file: "", is_na: 0 },
  { name: "5", document_title: "Gift Deed / Partition Deed / Will", document_status: "Uploaded", document_file: "", is_na: 0 },
  { name: "6", document_title: "Latest Property Tax Receipt", document_status: "Uploaded", document_file: "", is_na: 0 },
  { name: "7", document_title: "Electricity / BESCOM Connection ID", document_status: "Uploaded", document_file: "", is_na: 0 },
];

const ProgressRing = ({ percentage, size = 48 }: { percentage: number; size?: number }) => {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(38 92% 50%)"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-[10px] font-bold"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
      >
        {percentage}%
      </text>
    </svg>
  );
};

const PropertyRequests = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [propertyName, setPropertyName] = useState("");
  const [requests, setRequests] = useState<ServiceReq[]>([]);
  const [selectedSR, setSelectedSR] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocItem[]>(fallbackDocs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOne("DigiVault Property", id)
      .then((d) => setPropertyName(d?.property_name || ""))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!auth.client_id || !id) return;
    fetchList(
      "DigiVault Service Request",
      ["name", "sub_service", "progress_steps_completed", "progress_steps_total", "progress_percentage"],
      [["client", "=", auth.client_id], ["property", "=", id]]
    )
      .then((data: ServiceReq[]) => {
        if (data?.length) {
          setRequests(data);
          setSelectedSR(data[0].name);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth.client_id, id]);

  useEffect(() => {
    if (!selectedSR) return;
    fetchList(
      "DigiVault Client Document",
      ["name", "document_title", "document_status", "document_file", "is_na"],
      [["service_request", "=", selectedSR]]
    )
      .then((data: DocItem[]) => {
        if (data?.length) setDocs(data);
        else setDocs(fallbackDocs);
      })
      .catch(() => setDocs(fallbackDocs));
  }, [selectedSR]);

  const Badge = ({ status }: { status: string }) => {
    const s = statusStyles[status] ?? statusStyles.Pending;
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${s.bg} ${s.text}`}>
        {status}
      </span>
    );
  };

  const canView = (st: string) => ["Completed", "Uploaded", "On Going"].includes(st);
  const canDownload = (st: string) => ["Completed", "Uploaded"].includes(st);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Services" />

      <div className="px-4 py-4 space-y-4">
        {/* property name */}
        <div className="flex items-center gap-2">
          <Building2 size={20} className="text-primary" />
          <span className="font-bold text-foreground">{propertyName || "Property"}</span>
        </div>

        {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}

        {/* service request banners */}
        {requests.map((sr) => (
          <button
            key={sr.name}
            onClick={() => setSelectedSR(sr.name)}
            className={`w-full rounded-xl bg-primary p-4 flex items-center justify-between ${
              selectedSR === sr.name ? "ring-2 ring-ring ring-offset-2" : ""
            }`}
          >
            <span className="text-primary-foreground font-bold text-sm text-left flex-1 pr-3">{sr.sub_service}</span>
            <span className="bg-white/20 text-primary-foreground text-xs font-medium px-2 py-1 rounded-full mr-3">
              {sr.progress_steps_completed}/{sr.progress_steps_total}
            </span>
            <ProgressRing percentage={sr.progress_percentage} />
          </button>
        ))}

        {/* if no requests from API, show a placeholder banner */}
        {!loading && requests.length === 0 && (
          <div className="rounded-xl bg-primary p-4 flex items-center justify-between">
            <span className="text-primary-foreground font-bold text-sm">No service requests yet</span>
            <ProgressRing percentage={0} />
          </div>
        )}

        {/* document list */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Document List Table</h3>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_70px] bg-secondary px-3 py-2">
              <span className="text-[11px] font-semibold text-muted-foreground">Document Title</span>
              <span className="text-[11px] font-semibold text-muted-foreground text-center">Status</span>
              <span className="text-[11px] font-semibold text-muted-foreground text-center">Actions</span>
            </div>
            {docs.map((doc, i) => (
              <div
                key={doc.name + i}
                className={`grid grid-cols-[1fr_80px_70px] px-3 py-2.5 items-center ${
                  i < docs.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-xs text-foreground pr-2">{doc.document_title}</span>
                <span className="flex justify-center">
                  <Badge status={doc.document_status} />
                </span>
                <span className="flex justify-center gap-2">
                  {doc.is_na === 1 ? (
                    <span className="text-[10px] text-muted-foreground font-medium">N/A</span>
                  ) : (
                    <>
                      {canView(doc.document_status) && (
                        <button
                          onClick={() => doc.document_file && window.open(doc.document_file, "_blank")}
                          className="text-primary"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {canDownload(doc.document_status) && (
                        <a href={doc.document_file || "#"} download className="text-primary">
                          <Download size={16} />
                        </a>
                      )}
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomTabs />
    </div>
  );
};

export default PropertyRequests;
