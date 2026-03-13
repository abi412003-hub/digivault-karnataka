import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { Button } from "@/components/ui/button";
import { fetchOne } from "@/lib/api";

const ServiceRequestDetail = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sr, setSr] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!srId) return;
    fetchOne("DigiVault Service Request", srId)
      .then((data) => { if (data) setSr(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [srId]);

  const fmtDate = (d: string) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return d;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Service Request" />

      <div className="px-4 py-5 space-y-5">
        {/* Blue pill */}
        <div className="flex justify-center">
          <span className="px-5 py-2 rounded-full bg-[hsl(217_91%_93%)] text-[hsl(217_91%_53%)] text-sm font-semibold">
            Service Request
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
        ) : sr ? (
          <div className="rounded-xl border border-border p-4 space-y-3">
            <Row label="Project ID" value={sr.project || "-"} />
            <Row label="Project Title" value={sr.project || "-"} />
            <Row label="Property Title" value={sr.property || "-"} />
            <Row label="Service Request ID" value={sr.name || "-"} />
            <Row label="Date of Order" value={fmtDate(sr.request_date)} />
            <Row label="Main Service" value={sr.main_service || "-"} />
            <Row label="Sub Service" value={sr.sub_service || "-"} />
            <Row label="Order Status" value={sr.request_status || "-"} />
            <Row label="Payment Request" value={sr.payment_status || "Pending"} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Service request not found</p>
        )}

        {sr && (
          <div className="flex justify-center">
            <Button
              onClick={() => navigate(`/service-request/${encodeURIComponent(srId!)}/payment`)}
              className="w-[160px] bg-[hsl(217_91%_53%)] hover:bg-[hsl(217_91%_45%)] text-white"
            >
              Pay Now
            </Button>
          </div>
        )}
      </div>

      <BottomTabs />
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center">
    <span className="font-bold text-foreground text-sm">{label}</span>
    <span className="text-foreground text-sm text-right max-w-[55%]">{value}</span>
  </div>
);

export default ServiceRequestDetail;
