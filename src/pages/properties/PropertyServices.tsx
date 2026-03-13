import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList } from "@/lib/api";

interface ServiceReq {
  name: string;
  main_service: string;
}

const PropertyServices = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [tab, setTab] = useState<"applied" | "add">("applied");
  const [services, setServices] = useState<ServiceReq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.client_id || !id) return;
    fetchList(
      "DigiVault Service Request",
      ["name", "main_service"],
      [["client", "=", auth.client_id], ["property", "=", id]]
    )
      .then((d) => setServices(d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth.client_id, id]);

  const emptySlots = Math.max(0, 3 - services.length);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Services" />

      <div className="px-4 py-4 space-y-4">
        {/* heading */}
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <span className="text-sm font-bold text-foreground">Main Service</span>
        </div>

        {/* toggle pills */}
        <div className="flex gap-3">
          <button
            onClick={() => setTab("applied")}
            className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
              tab === "applied" ? "border-primary text-primary" : "border-input text-muted-foreground"
            }`}
          >
            Applied Services
          </button>
          <button
            onClick={() => {
              setTab("add");
              navigate(`/properties/${encodeURIComponent(id!)}/select-service`);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
              tab === "add" ? "border-primary text-primary" : "border-input text-muted-foreground"
            }`}
          >
            Add Services
          </button>
        </div>

        {/* applied services grid */}
        {loading && <p className="text-muted-foreground text-sm text-center py-8">Loading…</p>}

        {!loading && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {services.map((s) => (
              <div
                key={s.name}
                className="flex-shrink-0 w-[100px] h-[100px] rounded-xl bg-primary flex items-center justify-center p-2"
              >
                <span className="text-primary-foreground text-xs font-medium text-center leading-tight">
                  {s.main_service}
                </span>
              </div>
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <button
                key={`empty-${i}`}
                onClick={() => navigate(`/properties/${encodeURIComponent(id!)}/select-service`)}
                className="flex-shrink-0 w-[100px] h-[100px] rounded-xl border-2 border-dashed border-warning flex flex-col items-center justify-center gap-1"
              >
                <Plus size={20} className="text-warning" />
                <span className="text-xs text-warning font-medium">Services</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomTabs />
    </div>
  );
};

export default PropertyServices;
