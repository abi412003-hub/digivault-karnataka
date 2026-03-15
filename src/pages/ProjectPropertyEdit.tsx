import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord } from "@/lib/api";
import { projectTransition } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";
import { useFormDraft, hasDraft } from "@/hooks/useFormDraft";
import { validateForm, type FormRules, PATTERNS } from "@/lib/validation";
import { RequiredLabel, OptionalLabel } from "@/components/RequiredLabel";
import DraftIndicator from "@/components/DraftIndicator";
import {
  divisions, districtsByDivision, taluksByDistrict,
  cmcTmcOptions, pattanaPanchayathiByTaluk, urbanWards,
} from "@/lib/karnataka-data";

const Dropdown = ({
  label, value, onChange, options, placeholder = "Select", disabled = false, error, required,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean; error?: string; required?: boolean;
}) => (
  <div className="space-y-1">
    {required ? <RequiredLabel>{label}</RequiredLabel> : <label className="text-sm font-bold text-foreground">{label}</label>}
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className={`w-full h-11 appearance-none rounded-lg border bg-background px-3 pr-10 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ring ${error ? "border-destructive ring-1 ring-destructive" : "border-input"}`}>
        <option value="">{placeholder}</option>
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const ProjectPropertyEdit = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const projectName = searchParams.get("name") || projectId || "";
  const { auth } = useAuth();
  const { toast } = useToast();

  const DRAFT_KEY = `property-edit-${projectId || "new"}`;
  const hadDraft_ref = useRef(hasDraft(DRAFT_KEY));

  const [form, setField, clearDraft, setMultiple, lastSaved] = useFormDraft(DRAFT_KEY, {
    propertyType: "Apartment", propertyName: "", address: "",
    propertySizeUnit: "Square Feet", propertySize: "",
    doorNo: "", buildingName: "", crossRoad: "", mainRoad: "", landmark: "", areaName: "",
    division: "", district: "", taluk: "",
    urbanRural: "" as "Urban" | "Rural" | "",
    cmcType: "", pattana: "", ward: "", postOffice: "", pincode: "",
    latitude: "", longitude: "",
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeBtn, setShakeBtn] = useState(false);

  useEffect(() => {
    if (hadDraft_ref.current) toast({ title: "Draft found — continuing property details" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const districtOptions = form.division ? districtsByDivision[form.division] ?? [] : [];
  const talukOptions = form.district ? taluksByDistrict[form.district] ?? [] : [];
  const pattanaOptions = form.taluk ? pattanaPanchayathiByTaluk[form.taluk] ?? [] : [];

  const resetArea = () => setMultiple({ cmcType: "", pattana: "", ward: "" });

  const generatedAddress = useMemo(() => {
    const parts: string[] = [];
    if (form.doorNo) parts.push(form.doorNo);
    if (form.buildingName) parts.push(form.buildingName);
    if (form.crossRoad) parts.push(form.crossRoad);
    if (form.mainRoad) parts.push(form.mainRoad);
    if (form.landmark) parts.push("near " + form.landmark);
    if (form.areaName) parts.push(form.areaName);
    if (form.cmcType) parts.push(form.cmcType);
    if (form.pattana) parts.push(form.pattana);
    if (form.ward) parts.push(form.ward);
    if (form.taluk) parts.push(form.taluk);
    if (form.district) parts.push(form.district);
    if (form.division) parts.push(form.division);
    parts.push("KARNATAKA");
    if (form.pincode) parts.push(form.pincode);
    return parts.join(", ");
  }, [form.doorNo, form.buildingName, form.crossRoad, form.mainRoad, form.landmark, form.areaName, form.cmcType, form.pattana, form.ward, form.taluk, form.district, form.division, form.pincode]);

  const handleSave = async () => {
    const rules: FormRules = {
      propertyName: { required: true, minLength: 2, message: "Property name is required" },
      propertyType: { required: true, message: "Please select a property type" },
      division: { required: true, message: "Please select a division" },
      district: { required: true, message: "Please select a district" },
      taluk: { required: true, message: "Please select a taluk" },
      pincode: { pattern: PATTERNS.pincode, message: "Enter valid 6-digit pincode" },
    };
    if (form.pincode) rules.pincode!.required = false;
    const result = validateForm(form, rules);
    setErrors(result.errors);
    if (!result.valid) {
      setShakeBtn(true);
      setTimeout(() => setShakeBtn(false), 400);
      return;
    }

    setSaving(true);
    try {
      const res = await createRecord("DigiVault Property", {
        property_name: form.propertyName, property_type: form.propertyType,
        property_title: form.propertyName, property_address: generatedAddress,
        property_size: form.propertySize, property_state: "Karnataka",
        property_district: form.district, property_taluk: form.taluk,
        property_pincode: form.pincode, property_latitude: form.latitude,
        property_longitude: form.longitude, client: auth.client_id,
      });
      const propName = res?.data?.name || "";
      if (projectId) {
        await projectTransition("property_added", projectId).catch(() => {});
      }
      clearDraft();
      toast({ title: "Property saved!" });
      navigate(`/project/${encodeURIComponent(projectId || "")}/property-review?property=${encodeURIComponent(propName)}&projectName=${encodeURIComponent(projectName)}`, { replace: true });
    } catch {
      toast({ title: "Failed to save property", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStartFresh = () => {
    clearDraft();
    setMultiple({
      propertyType: "Apartment", propertyName: "", address: "",
      propertySizeUnit: "Square Feet", propertySize: "",
      doorNo: "", buildingName: "", crossRoad: "", mainRoad: "", landmark: "", areaName: "",
      division: "", district: "", taluk: "", urbanRural: "" as "",
      cmcType: "", pattana: "", ward: "", postOffice: "", pincode: "",
      latitude: "", longitude: "",
    });
    setErrors({});
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center bg-background border-b border-border px-4 h-14">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={22} />
        </button>
      </div>

      <div className="text-center py-3">
        <h1 className="text-xl font-bold">{projectName || "Project"}</h1>
        <p className="text-sm text-muted-foreground">{projectId}</p>
        <p className="text-sm font-semibold mt-1">Edit Property Details</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-4">
        <DraftIndicator lastSaved={lastSaved} onStartFresh={handleStartFresh} showStartFresh={hadDraft_ref.current} />

        <div data-field="propertyType">
          <Dropdown label="Select Property Type" value={form.propertyType} onChange={(v) => setField("propertyType", v)}
            options={["Apartment", "Independent House", "Villa", "Plot", "Agricultural Land", "Commercial"]} required error={errors.propertyType} />
        </div>

        <div className="space-y-1" data-field="propertyName">
          <RequiredLabel>Property Name</RequiredLabel>
          <Input value={form.propertyName} onChange={(e) => setField("propertyName", e.target.value)} placeholder="Ashwin Villa"
            className={`h-11 ${errors.propertyName ? "border-destructive ring-1 ring-destructive" : ""}`} />
          {errors.propertyName && <p className="text-xs text-destructive mt-1">{errors.propertyName}</p>}
        </div>

        <div className="space-y-1">
          <OptionalLabel>Address</OptionalLabel>
          <Input value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="Malleshwaram, 3rd cross" className="h-11" />
        </div>

        <Dropdown label="Select Property Size" value={form.propertySizeUnit} onChange={(v) => setField("propertySizeUnit", v)}
          options={["Square Feet", "Square Meters", "Acres", "Guntas", "Hectares"]} />

        <div className="space-y-1">
          <OptionalLabel>Property Size</OptionalLabel>
          <Input type="number" value={form.propertySize} onChange={(e) => setField("propertySize", e.target.value)} placeholder="25" className="h-11" />
        </div>

        <h3 className="text-sm font-bold border-b pb-1">Address</h3>

        <div className="space-y-1">
          <OptionalLabel>Door No</OptionalLabel>
          <Input value={form.doorNo} onChange={(e) => setField("doorNo", e.target.value)} placeholder="#18" className="h-11" />
        </div>
        <div className="space-y-1">
          <OptionalLabel>Building Name</OptionalLabel>
          <Input value={form.buildingName} onChange={(e) => setField("buildingName", e.target.value)} placeholder="Lakshmi Nivasa" className="h-11" />
        </div>
        <div className="space-y-1">
          <OptionalLabel>Cross Road</OptionalLabel>
          <Input value={form.crossRoad} onChange={(e) => setField("crossRoad", e.target.value)} placeholder="2nd Cross" className="h-11" />
        </div>
        <div className="space-y-1">
          <OptionalLabel>Main Road</OptionalLabel>
          <Input value={form.mainRoad} onChange={(e) => setField("mainRoad", e.target.value)} placeholder="Bannerghatta Main" className="h-11" />
        </div>
        <div className="space-y-1">
          <OptionalLabel>Landmark</OptionalLabel>
          <Input value={form.landmark} onChange={(e) => setField("landmark", e.target.value)} placeholder="Near Meenakshi Temple" className="h-11" />
        </div>
        <div className="space-y-1">
          <OptionalLabel>Area Name</OptionalLabel>
          <Input value={form.areaName} onChange={(e) => setField("areaName", e.target.value)} placeholder="Arekere MICO Layout" className="h-11" />
        </div>

        <Dropdown label="State" value="Karnataka" onChange={() => {}} options={["Karnataka"]} disabled />
        <div data-field="division">
          <Dropdown label="Zone" value={form.division} onChange={(v) => { setMultiple({ division: v, district: "", taluk: "" }); resetArea(); }} options={divisions} placeholder="Select Division" required error={errors.division} />
        </div>
        <div data-field="district">
          <Dropdown label="District" value={form.district} onChange={(v) => { setMultiple({ district: v, taluk: "" }); resetArea(); }} options={districtOptions} required error={errors.district} />
        </div>
        <div data-field="taluk">
          <Dropdown label="Taluk" value={form.taluk} onChange={(v) => { setField("taluk", v); resetArea(); }} options={talukOptions} required error={errors.taluk} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold underline">Select Urban / Rural</label>
          <div className="flex gap-6">
            {(["Urban", "Rural"] as const).map((opt) => (
              <button key={opt} onClick={() => { setField("urbanRural", opt); resetArea(); }} className="flex items-center gap-2 min-h-[44px]">
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.urbanRural === opt ? "border-primary" : "border-input"}`}>
                  {form.urbanRural === opt && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </span>
                <span className="text-sm">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        {form.urbanRural === "Urban" && (
          <>
            <Dropdown label="Select CMC/TMC/TP/GBA/MC" value={form.cmcType} onChange={(v) => setField("cmcType", v)} options={cmcTmcOptions} />
            <Dropdown label="Select Pattana Panchayathi" value={form.pattana} onChange={(v) => setField("pattana", v)} options={pattanaOptions} />
            <Dropdown label="Urban" value={form.ward} onChange={(v) => setField("ward", v)} options={urbanWards} />
          </>
        )}

        <div className="space-y-1">
          <OptionalLabel>Post Office</OptionalLabel>
          <Input value={form.postOffice} onChange={(e) => setField("postOffice", e.target.value)} placeholder="Ilanthila" className="h-11" />
        </div>
        <div className="space-y-1" data-field="pincode">
          <OptionalLabel>Pincode</OptionalLabel>
          <Input type="number" value={form.pincode} onChange={(e) => setField("pincode", e.target.value.slice(0, 6))} placeholder="560016"
            className={`h-11 ${errors.pincode ? "border-destructive ring-1 ring-destructive" : ""}`} />
          {errors.pincode && <p className="text-xs text-destructive mt-1">{errors.pincode}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold">Address Review</label>
          <textarea readOnly value={generatedAddress} className="w-full min-h-[80px] rounded-lg border border-input bg-muted px-3 py-2 text-sm resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <OptionalLabel>Latitude</OptionalLabel>
            <Input value={form.latitude} onChange={(e) => setField("latitude", e.target.value)} placeholder="12.9716" className="h-11" />
          </div>
          <div className="space-y-1">
            <OptionalLabel>Longitude</OptionalLabel>
            <Input value={form.longitude} onChange={(e) => setField("longitude", e.target.value)} placeholder="77.5946" className="h-11" />
          </div>
        </div>

        <button className="flex items-center gap-2 text-sm text-primary">
          Select the location <span className="text-destructive">📍</span>
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-3">
        <Button className={`w-full h-12 ${shakeBtn ? "animate-[shake_0.3s]" : ""}`} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save & Next"}
        </Button>
      </div>
    </div>
  );
};

export default ProjectPropertyEdit;
