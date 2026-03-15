import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FolderOpen, ClipboardList, FileText, MapPin, BarChart3, RefreshCw,
  Flag, Ruler, CheckCircle, Pencil, ShieldCheck, Handshake, MapPinned,
  GitBranch, Zap, Droplets, Factory, TrendingUp, Building, Scale,
  Users, Briefcase, UserCircle, Landmark, FileCheck, BookOpen,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { fetchList } from "@/lib/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const categoryIcons: Record<string, any> = {
  "Record Room Documents": FolderOpen, "Record  Room Documents": FolderOpen,
  "Survey Documents": ClipboardList, "E-katha": FileText, "E-Khatha": FileText,
  "Property Identification Documents": MapPin, "Conversion of Land": BarChart3,
  "Change of Land": RefreshCw, "Land Grants": Flag, "Podi and Durasthu": Ruler,
  "Podi": Ruler, "Durasti": Ruler, "Plan Approved": CheckCircle,
  "Plan Approvals": CheckCircle, "Amendments": Pencil, "Ammendments": Pencil,
  "No Objection Certificate": ShieldCheck, "Land Acquisitions": Handshake,
  "Land Acquisition": Handshake, "Land Allotments": MapPinned, "Land Allotment": MapPinned,
  "Property Bifurcation": GitBranch, "Electricity Board Approvals": Zap,
  "Water Supply Board Approvals": Droplets, "Pollution Control Board Approvals": Factory,
  "Land Assessment Survey and Property Valuations": TrendingUp,
  "Land Assessment, Survey and Property Valuations": TrendingUp,
  "Local Authority Services": Building, "Local Authority Service": Building,
  "Legal Documents": Scale, "Third Party Opinion": Users, "Third Party Opinions": Users,
  "Business Records": Briefcase, "Personal Record": UserCircle, "Personal Records": UserCircle,
  "Registration Documents": FileCheck, "BDA": Landmark, "BMRDA": BookOpen,
};

const SelectService = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const projectName = searchParams.get("projectName") || "";
  const [categories, setCategories] = useState<{ name: string; icon: any; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetchList("DigiVault Service", ["name", "service_name", "service_category"], [["is_active", "=", 1]], 500)
      .then((data: { name: string; service_name: string; service_category: string }[]) => {
        if (data?.length) {
          const catMap: Record<string, number> = {};
          data.forEach((s) => { const c = s.service_category || "Other"; catMap[c] = (catMap[c] || 0) + 1; });
          setCategories(
            Object.entries(catMap)
              .map(([name, count]) => ({ name, icon: categoryIcons[name] || FileText, count }))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (categoryName: string) => {
    setSelected(categoryName);
    const params = new URLSearchParams({ group: categoryName });
    if (projectId) params.set("project", projectId);
    if (projectName) params.set("projectName", projectName);
    navigate(`/properties/${encodeURIComponent(id!)}/select-sub-service?${params}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Select Main Service" />
      <div className="px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted animate-pulse min-h-[110px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {categories.map((s) => {
              const Icon = s.icon;
              return (
                <button key={s.name} onClick={() => handleSelect(s.name)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border bg-background p-2 min-h-[110px] w-full transition-colors ${
                    selected === s.name ? "border-2 border-[hsl(217_91%_60%)]" : "border-border"
                  }`}>
                  <Icon size={36} className="text-[hsl(217_91%_60%)]" strokeWidth={1.5} />
                  <span className="text-[11px] text-foreground text-center leading-tight">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground">{s.count} services</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <BottomTabs />
    </div>
  );
};

export default SelectService;
