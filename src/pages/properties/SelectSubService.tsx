import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList, createRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ekathaSubs = [
  "New E-Katha Registration",
  "Katha Bifurcation",
  "Khata Amalgamation",
  "Khata Conversion / Update",
  "Duplicate / Re-print Khata Certificate",
  "Correction / Update Khata Details_Name Correction in Khata",
  "Correction / Update Khata Details_Property Area / Measurement",
  "Correction / Update Khata Details_Property Usage / Type Correction",
  "Use downloadable e-Khata / Khata Certificate for legal/financial/trade use_Loan / Mortgage / Financial Transactions",
  "Use downloadable e-Khata / Khata Certificate for legal/financial/trade use_Property Sale / Purchase / Transfer",
  "Correction / Update Khata Property Area / Measurement Correction / Details_Property Usage / Type Correction",
  "Use downloadable e-Khata / Khata Certificate for legal/financial/trade use_Legal / Court Verification",
  "Use downloadable e-Khata / Khata Certificate for legal/financial/trade use_Trade / Business Use (Mortgage, Lease, Rent)",
  "Use downloadable e-Khata / Khata Certificate for legal/financial/trade use_Gov Schemes / Subsidy Applications",
];

const fallbackSubServices: Record<string, string[]> = {
  "E-katha": ekathaSubs,
};

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

  const [subServices, setSubServices] = useState<string[]>(
    fallbackSubServices[groupService] || ["Sub Service 1", "Sub Service 2", "Sub Service 3"]
  );

  useEffect(() => {
    if (!groupService) return;
    fetchList("DigiVault Service", ["name", "service_name"], [["parent_service", "=", groupService]])
      .then((data: { name: string }[]) => {
        if (data?.length) setSubServices(data.map((s) => s.name));
      })
      .catch(() => {});
  }, [groupService]);

  const handleSelect = async (subService: string) => {
    // If project already exists (coming from property flow), create service request directly
    if (projectId) {
      setSaving(true);
      try {
        const srRes = await createRecord("DigiVault Service Request", {
          client: auth.client_id,
          project: projectId,
          property: id,
          main_service: groupService,
          sub_service: subService,
          request_status: "Documents Pending",
          request_date: new Date().toISOString().split("T")[0],
        });
        const srName = srRes?.data?.name || "";
        toast({ title: "Service request created!" });
        navigate(`/service-request/${encodeURIComponent(srName)}/common-docs`, { replace: true });
      } catch {
        toast({ title: "Failed to create service request", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    } else {
      // No project yet — go to Create Project
      navigate(
        `/create-project?property=${encodeURIComponent(id!)}&main_service=${encodeURIComponent(groupService)}&sub_service=${encodeURIComponent(subService)}`
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title={`Select Sub Service`} />
      <div className="px-4 py-4 space-y-3">
        <p className="text-sm text-muted-foreground mb-2">
          Main Service: <span className="font-medium text-foreground">{groupService}</span>
        </p>
        <div className="grid grid-cols-3 gap-3">
          {subServices.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className="rounded-xl bg-[hsl(217_91%_53%)] p-3 min-h-[80px] flex items-center justify-center text-center transition-colors hover:bg-[hsl(217_91%_45%)]"
            >
              <span className="text-white text-[11px] font-medium leading-tight">{s}</span>
            </button>
          ))}
        </div>
      </div>
      <BottomTabs />
    </div>
  );
};

export default SelectSubService;
