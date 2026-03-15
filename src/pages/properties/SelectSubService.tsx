import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { fetchList, fetchOne } from "@/lib/api";

interface ServiceData {
  name: string;
  service_name: string;
  sub_services?: { sub_service_name: string }[];
}

const SelectSubService = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const groupService = searchParams.get("group") || "";
  const projectId = searchParams.get("project") || "";
  const projectName = searchParams.get("projectName") || "";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Two-level: first select main service, then sub-service
  const [mainServices, setMainServices] = useState<ServiceData[]>([]);
  const [selectedMain, setSelectedMain] = useState<string | null>(null);
  const [subServices, setSubServices] = useState<string[]>([]);

  // Fetch all services in this category
  useEffect(() => {
    if (!groupService) return;
    fetchList(
      "DigiVault Service",
      ["name", "service_name", "service_category"],
      [["service_category", "=", groupService], ["is_active", "=", 1]],
      200
    )
      .then((data: ServiceData[]) => {
        if (data?.length) setMainServices(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupService]);

  // When a main service is selected, fetch its sub_services child table
  const handleSelectMain = async (serviceName: string) => {
    setSelectedMain(serviceName);
    try {
      const full = await fetchOne("DigiVault Service", serviceName);
      const subs = (full?.sub_services || []).map(
        (s: { sub_service_name: string }) => s.sub_service_name
      );
      if (subs.length > 0) {
        setSubServices(subs);
      } else {
        // No sub-services — go to sub-sub-service page (it will auto-create SR if no sub-subs exist)
        const params = new URLSearchParams({
          category: groupService,
          main: serviceName,
          sub: "",
        });
        if (projectId) params.set("project", projectId);
        navigate(`/properties/${encodeURIComponent(id!)}/select-sub-sub-service?${params}`);
      }
    } catch {
      // Fallback: go to sub-sub-service which will auto-create SR
      const params = new URLSearchParams({
        category: groupService,
        main: serviceName,
        sub: "",
      });
      if (projectId) params.set("project", projectId);
      navigate(`/properties/${encodeURIComponent(id!)}/select-sub-sub-service?${params}`);
    }
  };

  const handleSelectSub = async (subService: string) => {
    // Navigate to sub-sub-service selection (step 6 in the flow)
    const params = new URLSearchParams({
      category: groupService,
      main: selectedMain!,
      sub: subService,
    });
    if (projectId) params.set("project", projectId);
    navigate(`/properties/${encodeURIComponent(id!)}/select-sub-sub-service?${params}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title={selectedMain ? "Select Sub Service" : "Select Service"} />
      <div className="px-4 py-4 space-y-3">
        <p className="text-sm text-muted-foreground mb-2">
          Category: <span className="font-medium text-foreground">{groupService}</span>
          {selectedMain && (
            <>
              {" → "}
              <span className="font-medium text-foreground">{selectedMain}</span>
              <button onClick={() => { setSelectedMain(null); setSubServices([]); }} className="ml-2 text-xs text-primary underline">Change</button>
            </>
          )}
        </p>

        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse min-h-[80px]" />
            ))}
          </div>
        ) : !selectedMain ? (
          /* Step 1: Show main services in this category */
          <div className="grid grid-cols-3 gap-3">
            {mainServices.map((s) => (
              <button
                key={s.name}
                onClick={() => handleSelectMain(s.name)}
                disabled={false}
                className="rounded-xl bg-[hsl(217_91%_53%)] p-3 min-h-[80px] flex items-center justify-center text-center transition-colors hover:bg-[hsl(217_91%_45%)] disabled:opacity-50"
              >
                <span className="text-white text-[11px] font-medium leading-tight">
                  {s.service_name || s.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Step 2: Show sub-services for selected main service */
          <div className="grid grid-cols-3 gap-3">
            {subServices.map((s) => (
              <button
                key={s}
                onClick={() => handleSelectSub(s)}
                disabled={false}
                className="rounded-xl bg-[hsl(217_91%_53%)] p-3 min-h-[80px] flex items-center justify-center text-center transition-colors hover:bg-[hsl(217_91%_45%)] disabled:opacity-50"
              >
                <span className="text-white text-[11px] font-medium leading-tight">{s}</span>
              </button>
            ))}
          </div>
        )}

      </div>
      <BottomTabs />
    </div>
  );
};

export default SelectSubService;
