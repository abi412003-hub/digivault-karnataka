import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOne, createRecord } from "@/lib/api";
import { srTransition } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";

const SelectSubSubService = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const mainService = searchParams.get("main") || "";
  const subService = searchParams.get("sub") || "";
  const projectId = searchParams.get("project") || "";
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subSubServices, setSubSubServices] = useState<string[]>([]);

  useEffect(() => {
    if (!mainService) return;
    // Fetch the service and get sub_sub_service values for the matching sub_service
    fetchOne("DigiVault Service", mainService)
      .then((data) => {
        const subs = data?.sub_services || [];
        // Get unique sub_sub_service values for the selected sub_service
        const subSubs = subs
          .filter((s: any) => s.sub_service_name === subService && s.sub_sub_service)
          .map((s: any) => s.sub_sub_service);
        const unique = [...new Set(subSubs)] as string[];

        if (unique.length === 0) {
          // No sub-sub-services — go directly to create SR + common docs
          handleCreateSR(subService, "");
        } else {
          setSubSubServices(unique);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainService, subService]);

  const handleSelect = async (subSubService: string) => {
    await handleCreateSR(subService, subSubService);
  };

  const handleCreateSR = async (sub: string, subSub: string) => {
    setSaving(true);
    try {
      let projId = projectId;
      // Auto-create project if needed
      if (!projId) {
        const projName = `${mainService}${sub ? " - " + sub : ""}${subSub ? " - " + subSub : ""}`;
        const projRes = await createRecord("DigiVault Project", {
          project_name: projName.slice(0, 140),
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

      const srBody: Record<string, any> = {
        client: auth.client_id,
        project: projId,
        main_service: mainService,
        sub_service: sub,
        sub_sub_service: subSub,
        request_status: "Documents Pending",
        request_date: new Date().toISOString().split("T")[0],
      };
      if (id && id !== "undefined" && id !== "null") {
        srBody.property = id;
      }

      const srRes = await createRecord("DigiVault Service Request", srBody);
      const srName = srRes?.data?.name || "";
      await srTransition("sr_created", srName).catch(() => {});
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
      <PageHeader title="Select Sub-Sub Service" />
      <div className="px-4 py-4 space-y-3">
        <p className="text-sm text-muted-foreground mb-1">
          {category && <><span className="font-medium text-foreground">{category}</span> → </>}
          <span className="font-medium text-foreground">{mainService}</span> →{" "}
          <span className="font-medium text-foreground">{subService}</span>
        </p>

        {loading || saving ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse min-h-[80px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {subSubServices.map((s) => (
              <button
                key={s}
                onClick={() => handleSelect(s)}
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

export default SelectSubSubService;
