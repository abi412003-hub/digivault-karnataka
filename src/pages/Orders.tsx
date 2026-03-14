import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList } from "@/lib/api";

interface SR {
  name: string;
  request_date: string;
  request_status: string;
  main_service: string;
  sub_service: string;
}

const Orders = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SR[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.client_id) return;
    fetchList(
      "DigiVault Service Request",
      ["name", "request_date", "request_status", "main_service", "sub_service"],
      [["client", "=", auth.client_id]]
    )
      .then((data: SR[]) => {
        if (data?.length) setOrders(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth.client_id]);

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
      <PageHeader title="Orders" />
      <div className="px-4 py-4 space-y-3">
        {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading orders…</p>}
        {!loading && orders.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
        )}
        {orders.map((sr) => (
          <div
            key={sr.name}
            className="rounded-xl border border-border bg-background p-4 flex gap-3 items-start"
            style={{ borderLeft: "4px solid hsl(217 91% 90%)" }}
          >
            <div className="w-10 h-10 rounded-full bg-[hsl(217_91%_93%)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText size={18} className="text-[hsl(217_91%_53%)]" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-bold text-foreground">Service</p>
              <p className="text-xs text-muted-foreground">Request ID : {sr.name}</p>
              <p className="text-xs text-muted-foreground">Date : {fmtDate(sr.request_date)}</p>
              <p className="text-xs text-muted-foreground">Status : {sr.request_status || "On Going"}</p>
            </div>
            <div className="flex flex-col gap-1.5 self-end">
              <button
                onClick={() => navigate(`/service-request/${encodeURIComponent(sr.name)}/detail`)}
                className="text-[hsl(217_91%_53%)] text-sm font-semibold"
              >
                View
              </button>
              <button
                onClick={() => navigate(`/service-request/${encodeURIComponent(sr.name)}/track`)}
                className="text-[hsl(var(--success))] text-xs font-semibold"
              >
                Track
              </button>
            </div>
          </div>
        ))}
      </div>
      <BottomTabs />
    </div>
  );
};

export default Orders;
