import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList, fetchOne, createRecord } from "@/lib/api";
import { srTransition } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";

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
  const { auth } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
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
        // No sub-services — create SR directly with this main service
        await createServiceRequest(serviceName, "");
      }
    } catch {
      // Fallback: create SR with just the main service
      await createServiceRequest(serviceName, "");
    }
  };

  const handleSelectSub = async (subService: string) => {
    await createServiceRequest(selectedMain!, subService);
  };

  const createServiceRequest = async (mainService: string, subService: string) => {
    setSaving(true);
    try {
      let projId = projectId;

      // If no project exists, create one automatically
      if (!projId) {
        const projName = `${mainService}${subService ? " - " + subService : ""}`;
        const projRes = await createRecord("DigiVault Project", {
          project_name: projName,
          client: auth.client_id,
          project_status: "In Progress",
          service: mainService,
        });
        projId = projRes?.data?.name || "";
        if (!projId) {
          toast({ title: "Failed to create project", variant: "destructive" });
          setSaving(false);
          return;
        }
      }

      // Create the service request
      const srBody: Record<string, any> = {
        client: auth.client_id,
        project: projId,
        main_service: mainService,
        sub_service: subService,
        request_status: "Documents Pending",
        request_date: new Date().toISOString().split("T")[0],
      };
      // Only include property if we have a valid property ID
      if (id && id !== "undefined" && id !== "null") {
        srBody.property = id;
      }
      const srRes = await createRecord("DigiVault Service Request", srBody);
      const srName = srRes?.data?.name || "";
      await srTransition("sr_created", srName).catch(() => {});
      toast({ title: "Service request created!" });

      // Go directly to common documents upload
      navigate(`/service-request/${encodeURIComponent(srName)}/common-docs`, { replace: true });
    } catch {
      toast({ title: "Failed to create service request", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
                disabled={saving}
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
                disabled={saving}
                className="rounded-xl bg-[hsl(217_91%_53%)] p-3 min-h-[80px] flex items-center justify-center text-center transition-colors hover:bg-[hsl(217_91%_45%)] disabled:opacity-50"
              >
                <span className="text-white text-[11px] font-medium leading-tight">{s}</span>
              </button>
            ))}
          </div>
        )}

        {saving && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Creating service request...
          </p>
        )}
      </div>
      <BottomTabs />
    </div>
  );
};

export default SelectSubService;
