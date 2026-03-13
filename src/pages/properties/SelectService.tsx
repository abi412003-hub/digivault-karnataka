import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FolderOpen, ClipboardList, FileText, MapPin, BarChart3, RefreshCw,
  Flag, Ruler, CheckCircle, Pencil, ShieldCheck, Handshake, MapPinned,
  GitBranch, Zap, Droplets, Factory, TrendingUp, Building, Scale,
  Users, Briefcase, UserCircle,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { fetchList } from "@/lib/api";

const allServices = [
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
  { name: "Water Supply Board Approvals", icon: Droplets },
  { name: "Pollution Control Board Approvals", icon: Factory },
  { name: "Land Assessment, Survey & Property Valuations", icon: TrendingUp },
  { name: "Local Authority Services", icon: Building },
  { name: "Legal Documents", icon: Scale },
  { name: "Third Party Opinion", icon: Users },
  { name: "Business Records", icon: Briefcase },
  { name: "Personal Record", icon: UserCircle },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = Object.fromEntries(allServices.map((s) => [s.name, s.icon]));

interface ServiceItem {
  name: string;
  service_group?: string;
  service_icon?: string;
  is_group_service?: number;
}

const SelectService = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [services, setServices] = useState(allServices);
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
      <PageHeader title="Select Main Service" />
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          {services.map((s) => {
            const Icon = s.icon;
            const isSelected = selected === s.name;
            return (
              <button
                key={s.name}
                onClick={() => handleSelect(s.name)}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border bg-background p-2 min-h-[110px] w-full transition-colors ${
                  isSelected ? "border-2 border-[hsl(217_91%_60%)]" : "border-border"
                }`}
              >
                <Icon size={40} className="text-[hsl(217_91%_60%)]" strokeWidth={1.5} />
                <span className="text-[11px] text-foreground text-center leading-tight">{s.name}</span>
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
