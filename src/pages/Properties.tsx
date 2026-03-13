import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Building2, MapPin, Camera, Info, Wrench, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList } from "@/lib/api";

interface Property {
  name: string;
  property_name: string;
  sr_id: string;
  property_type: string;
  property_district: string;
  property_taluk: string;
  property_latitude: string;
  property_longitude: string;
}

const actions = [
  { key: "location", icon: MapPin, label: "Locate" },
  { key: "photos", icon: Camera, label: "Photos" },
  { key: "details", icon: Info, label: "Details" },
  { key: "services", icon: Wrench, label: "Service" },
  { key: "requests", icon: FileText, label: "Service Request" },
];

const Properties = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.client_id) return;
    fetchList(
      "DigiVault Property",
      ["name", "property_name", "property_type", "property_district", "property_taluk", "property_latitude", "property_longitude"],
      [["client", "=", auth.client_id]]
    )
      .then((d) => setProperties(d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth.client_id]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Properties" />

      <div className="px-4 py-4 space-y-4">
        {/* Sub-header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark size={18} className="text-foreground" />
            <span className="font-bold text-foreground text-sm">Properties - {properties.length}</span>
          </div>
          <Button size="sm" onClick={() => navigate("/properties/add")}>
            Add Property
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}

        {!loading && properties.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <Building2 size={40} className="mx-auto text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No properties found. Add your first property.</p>
          </div>
        )}

        {properties.map((p) => (
          <div key={p.name} className="rounded-xl bg-muted p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Building2 size={28} className="text-primary mt-0.5" />
              <div>
                <p className="font-bold text-foreground">{p.property_name}</p>
                <p className="text-xs text-muted-foreground">SR ID - {p.sr_id || "N/A"}</p>
              </div>
            </div>

            {/* action buttons */}
            <div className="rounded-lg bg-background p-3">
              <div className="flex justify-between">
                {actions.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.key}
                      onClick={() => navigate(`/properties/${encodeURIComponent(p.name)}/${a.key}`)}
                      className="flex flex-col items-center gap-1 min-w-[54px]"
                    >
                      <span className="w-9 h-9 rounded-full border-2 border-primary flex items-center justify-center">
                        <Icon size={16} className="text-primary" />
                      </span>
                      <span className="text-[11px] text-primary font-medium text-center leading-tight">{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomTabs />
    </div>
  );
};

export default Properties;
