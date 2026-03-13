import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FolderOpen, ClipboardList, FileText, MapPin, BarChart3, RefreshCw,
  Flag, Ruler, CheckCircle, Pencil, ShieldCheck, Handshake, MapPinned,
  GitBranch, Zap,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { fetchList } from "@/lib/api";

const fallbackServices = [
  { name: "Record Room Documents", icon: FolderOpen },
  { name: "Survey Documents", icon: ClipboardList },
  { name: "E-katha", icon: FileText },
  { name: "Property Identification Documents", icon: MapPin },
  { name: "Conversion of Land", icon: BarChart3 },
  { name: "Change of Land", icon: RefreshCw },
  { name: "Land Grants", icon: Flag },
  { name: "Podi and Durasthu", icon: Ruler },
  { name: "Plan Approved", icon: CheckCircle },
  { name: "Amendments", icon: Pencil },
  { name: "No Objection Certificate", icon: ShieldCheck },
  { name: "Land Acquisitions", icon: Handshake },
  { name: "Land Allotments", icon: MapPinned },
  { name: "Property Bifurcation", icon: GitBranch },
  { name: "Electricity Board Approvals", icon: Zap },
];

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  "Record Room Documents": FolderOpen,
  "Survey Documents": ClipboardList,
  "E-katha": FileText,
  "Property Identification Documents": MapPin,
  "Conversion of Land": BarChart3,
  "Change of Land": RefreshCw,
  "Land Grants": Flag,
  "Podi and Durasthu": Ruler,
  "Plan Approved": CheckCircle,
  "Amendments": Pencil,
  "No Objection Certificate": ShieldCheck,
  "Land Acquisitions": Handshake,
  "Land Allotments": MapPinned,
  "Property Bifurcation": GitBranch,
  "Electricity Board Approvals": Zap,
};

interface ServiceItem {
  name: string;
  service_group?: string;
  service_icon?: string;
  is_group_service?: number;
}

const SelectService = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [services, setServices] = useState<{ name: string; icon: React.ComponentType<any> }[]>(fallbackServices);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetchList("DigiVault Service", ["name", "service_group", "service_icon", "is_group_service"], [["is_group_service", "=", 1]])
      .then((data: ServiceItem[]) => {
        if (data?.length) {
          setServices(
            data.map((s) => ({
              name: s.name,
              icon: iconMap[s.name] || FileText,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleSelect = (serviceName: string) => {
    setSelected(serviceName);
    navigate(
      `/properties/${encodeURIComponent(id!)}/select-sub-service?group=${encodeURIComponent(serviceName)}`
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Select Services" />
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          {services.map((s) => {
            const Icon = s.icon;
            const isSelected = selected === s.name;
            return (
              <button
                key={s.name}
                onClick={() => handleSelect(s.name)}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border bg-background p-3 min-h-[110px] transition-colors ${
                  isSelected ? "border-2 border-primary" : "border-border"
                }`}
              >
                <Icon size={48} className="text-primary" strokeWidth={1.5} />
                <span className="text-xs text-foreground text-center leading-tight">{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <BottomTabs />
    </div>
  );
};

export default SelectService;
