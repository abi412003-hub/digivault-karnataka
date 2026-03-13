import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown } from "lucide-react";
import {
  divisions,
  districtsByDivision,
  taluksByDistrict,
} from "@/lib/karnataka-data";

const propertyTypes = ["Apartment", "Independent House", "Plot", "Agricultural Land", "Commercial"];

const Dropdown = ({ label, value, onChange, options, placeholder = "Select", disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-bold text-foreground">{label}</label>
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full h-12 appearance-none rounded-lg border border-input bg-background px-4 pr-10 text-sm text-foreground disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ring">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
  </div>
);

const AddProperty = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [rtc, setRtc] = useState("");
  const [size, setSize] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [taluk, setTaluk] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);

  const districtOptions = division ? districtsByDivision[division] ?? [] : [];
  const talukOptions = district ? taluksByDistrict[district] ?? [] : [];

  const handleSubmit = async () => {
    if (!name.trim()) { toast({ title: "Property name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await createRecord("DigiVault Property", {
        client: auth.client_id,
        property_name: name,
        property_type: type,
        property_title: title,
        property_rtc: rtc,
        property_size: size,
        property_state: "Karnataka",
        property_division: division,
        property_district: district,
        property_taluk: taluk,
        property_latitude: latitude,
        property_longitude: longitude,
      });
      toast({ title: "Property added!" });
      navigate("/properties", { replace: true });
    } catch {
      toast({ title: "Failed to add property", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Add Property" />
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-28 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-bold text-foreground">Property Name <span className="text-destructive">*</span></label>
          <Input placeholder="Enter property name" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
        </div>
        <Dropdown label="Property Type" value={type} onChange={setType} options={propertyTypes} />
        <div className="space-y-1">
          <label className="text-sm font-bold text-foreground">Property Title</label>
          <Input placeholder="Enter title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold text-foreground">RTC</label>
          <Input placeholder="Enter RTC" value={rtc} onChange={(e) => setRtc(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold text-foreground">Size</label>
          <Input placeholder="Enter size" value={size} onChange={(e) => setSize(e.target.value)} className="h-12" />
        </div>
        <Dropdown label="Division" value={division} onChange={(v) => { setDivision(v); setDistrict(""); setTaluk(""); }} options={divisions} />
        <Dropdown label="District" value={district} onChange={(v) => { setDistrict(v); setTaluk(""); }} options={districtOptions} placeholder={division ? "Select District" : "Select Division first"} />
        <Dropdown label="Taluk" value={taluk} onChange={setTaluk} options={talukOptions} placeholder={district ? "Select Taluk" : "Select District first"} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground">Latitude</label>
            <Input placeholder="12.9716" value={latitude} onChange={(e) => setLatitude(e.target.value)} className="h-12" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground">Longitude</label>
            <Input placeholder="77.5946" value={longitude} onChange={(e) => setLongitude(e.target.value)} className="h-12" />
          </div>
        </div>
      </div>
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border px-4 py-3">
        <Button className="w-full h-12" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving…" : "Save Property"}
        </Button>
      </div>
      <BottomTabs />
    </div>
  );
};

export default AddProperty;
