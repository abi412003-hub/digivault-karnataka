import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList, createRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const fallbackSubServices = [
  "New E-Katha Registration",
  "E-Katha Transfer",
  "E-Katha Name Correction",
];

const SelectSubService = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const groupService = searchParams.get("group") || "";
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();

  const [subServices, setSubServices] = useState<string[]>(fallbackSubServices);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!groupService) return;
    fetchList("DigiVault Service", ["name", "service_group", "parent_service"], [["parent_service", "=", groupService]])
      .then((data: { name: string }[]) => {
        if (data?.length) setSubServices(data.map((s) => s.name));
      })
      .catch(() => {});
  }, [groupService]);

  const handleSelect = async (subService: string) => {
    setSelected(subService);
    setSaving(true);
    try {
      const res = await createRecord("DigiVault Service Request", {
        client: auth.client_id,
        property: id,
        main_service: groupService,
        sub_service: subService,
        request_status: "Documents Pending",
        request_date: new Date().toISOString().split("T")[0],
        progress_steps_total: 10,
        progress_steps_completed: 0,
        progress_percentage: 0,
      });
      const srName = res?.data?.name || "";
      toast({ title: "Service request created!" });
      navigate(`/service-request/${encodeURIComponent(srName)}/common-docs`, { replace: true });
    } catch {
      toast({ title: "Failed to create service request", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Select Sub Service" />
      <div className="px-4 py-4 space-y-3">
        <p className="text-sm text-muted-foreground mb-2">
          Group: <span className="font-medium text-foreground">{groupService}</span>
        </p>
        {subServices.map((s) => (
          <button
            key={s}
            onClick={() => handleSelect(s)}
            disabled={saving}
            className={`w-full text-left rounded-xl border bg-background p-4 transition-colors ${
              selected === s ? "border-2 border-primary" : "border-border"
            }`}
          >
            <span className="font-bold text-foreground">{s}</span>
          </button>
        ))}
        {saving && <p className="text-sm text-muted-foreground text-center py-4">Creating service request…</p>}
      </div>
      <BottomTabs />
    </div>
  );
};

export default SelectSubService;
