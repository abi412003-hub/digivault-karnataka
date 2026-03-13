import { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord, updateRecord } from "@/lib/api";
import { projectTransition } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";
import {
  divisions,
  districtsByDivision,
  taluksByDistrict,
  cmcTmcOptions,
  pattanaPanchayathiByTaluk,
  urbanWards,
  gramPanchayathiByTaluk,
  villagesByGP,
} from "@/lib/karnataka-data";

const Dropdown = ({
  label, value, onChange, options, placeholder = "Select", disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-bold text-foreground">{label}</label>
    <div className="relative">
      <select
        value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full h-11 appearance-none rounded-lg border border-input bg-background px-3 pr-10 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
  </div>
);

const ProjectPropertyEdit = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const projectName = searchParams.get("name") || projectId || "";
  const { auth } = useAuth();
  const { toast } = useToast();

  // Property fields
  const [propertyType, setPropertyType] = useState("Apartment");
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [propertySizeUnit, setPropertySizeUnit] = useState("Square Feet");
  const [propertySize, setPropertySize] = useState("");

  // Address detail fields
  const [doorNo, setDoorNo] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [crossRoad, setCrossRoad] = useState("");
  const [mainRoad, setMainRoad] = useState("");
  const [landmark, setLandmark] = useState("");
  const [areaName, setAreaName] = useState("");

  // Karnataka hierarchy
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [taluk, setTaluk] = useState("");
  const [urbanRural, setUrbanRural] = useState<"Urban" | "Rural" | "">("");
  const [cmcType, setCmcType] = useState("");
  const [pattana, setPattana] = useState("");
  const [ward, setWard] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);

  const districtOptions = division ? districtsByDivision[division] ?? [] : [];
  const talukOptions = district ? taluksByDistrict[district] ?? [] : [];
  const pattanaOptions = taluk ? pattanaPanchayathiByTaluk[taluk] ?? [] : [];

  const resetArea = () => { setCmcType(""); setPattana(""); setWard(""); };

  const generatedAddress = useMemo(() => {
    const parts: string[] = [];
    if (doorNo) parts.push(doorNo);
    if (buildingName) parts.push(buildingName);
    if (crossRoad) parts.push(crossRoad);
    if (mainRoad) parts.push(mainRoad);
    if (landmark) parts.push("near " + landmark);
    if (areaName) parts.push(areaName);
    if (cmcType) parts.push(cmcType);
    if (pattana) parts.push(pattana);
    if (ward) parts.push(ward);
    if (taluk) parts.push(taluk);
    if (district) parts.push(district);
    if (division) parts.push(division);
    parts.push("KARNATAKA");
    if (pincode) parts.push(pincode);
    return parts.join(", ");
  }, [doorNo, buildingName, crossRoad, mainRoad, landmark, areaName, cmcType, pattana, ward, taluk, district, division, pincode]);

  const handleSave = async () => {
    if (!propertyName.trim()) {
      toast({ title: "Property Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await createRecord("DigiVault Property", {
        property_name: propertyName,
        property_type: propertyType,
        property_title: propertyName,
        property_address: generatedAddress,
        property_size: propertySize,
        property_state: "Karnataka",
        property_district: district,
        property_taluk: taluk,
        property_pincode: pincode,
        property_latitude: latitude,
        property_longitude: longitude,
        client: auth.client_id,
      });
      const propName = res?.data?.name || "";

      // Workflow: Project Draft → Property Mapped
      if (projectId) {
        await projectTransition("property_added", projectId).catch(() => {});
      }

      toast({ title: "Property saved!" });
      navigate(`/project/${encodeURIComponent(projectId || "")}/property-review?property=${encodeURIComponent(propName)}&projectName=${encodeURIComponent(projectName)}`, { replace: true });
    } catch {
      toast({ title: "Failed to save property", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-background border-b border-border px-4 h-14">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={22} />
        </button>
      </div>

      {/* Project info */}
      <div className="text-center py-3">
        <h1 className="text-xl font-bold">{projectName || "Project"}</h1>
        <p className="text-sm text-muted-foreground">{projectId}</p>
        <p className="text-sm font-semibold mt-1">Edit Property Details</p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-4">
        <Dropdown label="Select Property Type" value={propertyType} onChange={setPropertyType}
          options={["Apartment", "Independent House", "Villa", "Plot", "Agricultural Land", "Commercial"]} />

        <div className="space-y-1">
          <label className="text-sm font-bold">Property Name</label>
          <Input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="Ashwin Villa" className="h-11" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold">Address</label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Malleshwaram, 3rd cross" className="h-11" />
        </div>

        <Dropdown label="Select Property Size" value={propertySizeUnit} onChange={setPropertySizeUnit}
          options={["Square Feet", "Square Meters", "Acres", "Guntas", "Hectares"]} />

        <div className="space-y-1">
          <label className="text-sm font-bold">Property Size</label>
          <Input type="number" value={propertySize} onChange={(e) => setPropertySize(e.target.value)} placeholder="25" className="h-11" />
        </div>

        <h3 className="text-sm font-bold border-b pb-1">Address</h3>

        <div className="space-y-1">
          <label className="text-sm font-bold">Door No</label>
          <Input value={doorNo} onChange={(e) => setDoorNo(e.target.value)} placeholder="#18" className="h-11" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold">Building Name</label>
          <Input value={buildingName} onChange={(e) => setBuildingName(e.target.value)} placeholder="Lakshmi Nivasa" className="h-11" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold">Cross Road</label>
          <Input value={crossRoad} onChange={(e) => setCrossRoad(e.target.value)} placeholder="2nd Cross" className="h-11" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold">Main Road</label>
          <Input value={mainRoad} onChange={(e) => setMainRoad(e.target.value)} placeholder="Bannerghatta Main" className="h-11" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold">Landmark</label>
          <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near Meenakshi Temple" className="h-11" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold">Area Name</label>
          <Input value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="Arekere MICO Layout" className="h-11" />
        </div>

        <Dropdown label="State" value="Karnataka" onChange={() => {}} options={["Karnataka"]} disabled />
        <Dropdown label="Zone" value={division} onChange={(v) => { setDivision(v); setDistrict(""); setTaluk(""); resetArea(); }} options={divisions} placeholder="Select Division" />
        <Dropdown label="District" value={district} onChange={(v) => { setDistrict(v); setTaluk(""); resetArea(); }} options={districtOptions} />
        <Dropdown label="Taluk" value={taluk} onChange={(v) => { setTaluk(v); resetArea(); }} options={talukOptions} />

        <div className="space-y-2">
          <label className="text-sm font-bold underline">Select Urban / Rural</label>
          <div className="flex gap-6">
            {(["Urban", "Rural"] as const).map((opt) => (
              <button key={opt} onClick={() => { setUrbanRural(opt); resetArea(); }} className="flex items-center gap-2 min-h-[44px]">
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${urbanRural === opt ? "border-primary" : "border-input"}`}>
                  {urbanRural === opt && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </span>
                <span className="text-sm">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        {urbanRural === "Urban" && (
          <>
            <Dropdown label="Select CMC/TMC/TP/GBA/MC" value={cmcType} onChange={setCmcType} options={cmcTmcOptions} />
            <Dropdown label="Select Pattana Panchayathi" value={pattana} onChange={setPattana} options={pattanaOptions} />
            <Dropdown label="Urban" value={ward} onChange={setWard} options={urbanWards} />
          </>
        )}

        <div className="space-y-1">
          <label className="text-sm font-bold">Post Office</label>
          <Input value={postOffice} onChange={(e) => setPostOffice(e.target.value)} placeholder="Ilanthila" className="h-11" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold">Pincode</label>
          <Input type="number" value={pincode} onChange={(e) => setPincode(e.target.value.slice(0, 6))} placeholder="560016" className="h-11" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold">Address Review</label>
          <textarea readOnly value={generatedAddress} className="w-full min-h-[80px] rounded-lg border border-input bg-muted px-3 py-2 text-sm resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-bold">Latitude</label>
            <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="12.9716" className="h-11" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold">Longitude</label>
            <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="77.5946" className="h-11" />
          </div>
        </div>

        <button className="flex items-center gap-2 text-sm text-primary">
          Select the location <span className="text-red-500">📍</span>
        </button>
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-3">
        <Button className="w-full h-12" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save & Next"}
        </Button>
      </div>
    </div>
  );
};

export default ProjectPropertyEdit;
