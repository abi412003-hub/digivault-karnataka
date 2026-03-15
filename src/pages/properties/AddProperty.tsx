import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown } from "lucide-react";
import { useFormDraft, hasDraft } from "@/hooks/useFormDraft";
import { validateForm, type FormRules } from "@/lib/validation";
import { RequiredLabel, OptionalLabel } from "@/components/RequiredLabel";
import DraftIndicator from "@/components/DraftIndicator";
import {
  divisions,
  districtsByDivision,
  taluksByDistrict,
} from "@/lib/karnataka-data";

const propertyTypes = ["Apartment", "Independent House", "Plot", "Agricultural Land", "Commercial"];

const Dropdown = ({ label, value, onChange, options, placeholder = "Select", disabled = false, error, required }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean; error?: string; required?: boolean;
}) => (
  <div className="space-y-1">
    {required ? <RequiredLabel>{label}</RequiredLabel> : <label className="text-sm font-bold text-foreground">{label}</label>}
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className={`w-full h-12 appearance-none rounded-lg border bg-background px-4 pr-10 text-sm text-foreground disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ring ${error ? "border-destructive ring-1 ring-destructive" : "border-input"}`}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const DRAFT_KEY = "add-property";

const AddProperty = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();

  const hadDraft = useRef(hasDraft(DRAFT_KEY));
  const [form, setField, clearDraft, setMultiple, lastSaved] = useFormDraft(DRAFT_KEY, {
    name: "", type: "", title: "", rtc: "", size: "",
    division: "", district: "", taluk: "", latitude: "", longitude: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeBtn, setShakeBtn] = useState(false);

  useEffect(() => {
    if (hadDraft.current) toast({ title: "Draft found — continuing property form" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const districtOptions = form.division ? districtsByDivision[form.division] ?? [] : [];
  const talukOptions = form.district ? taluksByDistrict[form.district] ?? [] : [];

  const handleSubmit = async () => {
    const rules: FormRules = {
      name: { required: true, minLength: 2, message: "Property name is required" },
      type: { required: true, message: "Please select a property type" },
      division: { required: true, message: "Please select a division" },
      district: { required: true, message: "Please select a district" },
      taluk: { required: true, message: "Please select a taluk" },
    };
    const result = validateForm(form, rules);
    setErrors(result.errors);
    if (!result.valid) {
      setShakeBtn(true);
      setTimeout(() => setShakeBtn(false), 400);
      return;
    }

    setSaving(true);
    try {
      const projParam = new URLSearchParams(window.location.search).get("project") || "";
      const projCtx = JSON.parse(localStorage.getItem("edv_current_project") || "{}");
      const linkedProject = projParam || projCtx.id || "";

      const propRes = await createRecord("DigiVault Property", {
        client: auth.client_id,
        project: linkedProject,
        property_name: form.name, property_type: form.type,
        property_title: form.title, property_rtc: form.rtc, property_size: form.size,
        property_state: "Karnataka", property_division: form.division,
        property_district: form.district, property_taluk: form.taluk,
        property_latitude: form.latitude, property_longitude: form.longitude,
      });
      const propId = propRes?.data?.name || "";
      clearDraft();
      toast({ title: "Property added!" });
      // Navigate to service selection with project context
      const params = linkedProject ? `?project=${encodeURIComponent(linkedProject)}` : "";
      navigate(`/properties/${encodeURIComponent(propId)}/select-service${params}`, { replace: true });
    } catch {
      toast({ title: "Failed to add property", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStartFresh = () => {
    clearDraft();
    setMultiple({ name: "", type: "", title: "", rtc: "", size: "", division: "", district: "", taluk: "", latitude: "", longitude: "" });
    setErrors({});
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Add Property" />
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-28 space-y-4">
        <DraftIndicator lastSaved={lastSaved} onStartFresh={handleStartFresh} showStartFresh={hadDraft.current} />

        <div className="space-y-1" data-field="name">
          <RequiredLabel>Property Name</RequiredLabel>
          <Input placeholder="Enter property name" value={form.name} onChange={(e) => setField("name", e.target.value)}
            className={`h-12 ${errors.name ? "border-destructive ring-1 ring-destructive" : ""}`} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
        <div data-field="type">
          <Dropdown label="Property Type" value={form.type} onChange={(v) => setField("type", v)} options={propertyTypes} required error={errors.type} />
        </div>
        <div className="space-y-1">
          <OptionalLabel>Property Title</OptionalLabel>
          <Input placeholder="Enter title" value={form.title} onChange={(e) => setField("title", e.target.value)} className="h-12" />
        </div>
        <div className="space-y-1">
          <OptionalLabel>RTC</OptionalLabel>
          <Input placeholder="Enter RTC" value={form.rtc} onChange={(e) => setField("rtc", e.target.value)} className="h-12" />
        </div>
        <div className="space-y-1">
          <OptionalLabel>Size</OptionalLabel>
          <Input placeholder="Enter size" value={form.size} onChange={(e) => setField("size", e.target.value)} className="h-12" />
        </div>
        <div data-field="division">
          <Dropdown label="Division" value={form.division} onChange={(v) => setMultiple({ division: v, district: "", taluk: "" })} options={divisions} required error={errors.division} />
        </div>
        <div data-field="district">
          <Dropdown label="District" value={form.district} onChange={(v) => setMultiple({ district: v, taluk: "" })} options={districtOptions} placeholder={form.division ? "Select District" : "Select Division first"} required error={errors.district} />
        </div>
        <div data-field="taluk">
          <Dropdown label="Taluk" value={form.taluk} onChange={(v) => setField("taluk", v)} options={talukOptions} placeholder={form.district ? "Select Taluk" : "Select District first"} required error={errors.taluk} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <OptionalLabel>Latitude</OptionalLabel>
            <Input placeholder="12.9716" value={form.latitude} onChange={(e) => setField("latitude", e.target.value)} className="h-12" />
          </div>
          <div className="space-y-1">
            <OptionalLabel>Longitude</OptionalLabel>
            <Input placeholder="77.5946" value={form.longitude} onChange={(e) => setField("longitude", e.target.value)} className="h-12" />
          </div>
        </div>
      </div>
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border px-4 py-3">
        <Button className={`w-full h-12 ${shakeBtn ? "animate-[shake_0.3s]" : ""}`} onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving…" : "Save Property"}
        </Button>
      </div>
      <BottomTabs />
    </div>
  );
};

export default AddProperty;
