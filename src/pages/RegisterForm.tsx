import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, ChevronDown, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord } from "@/lib/api";
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

/* ── tiny dropdown component ───────────────────────────────── */
const Dropdown = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-bold text-foreground">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-12 appearance-none rounded-lg border border-input bg-background px-4 pr-10 text-sm text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  </div>
);

/* ── main form ──────────────────────────────────────────────── */
const RegisterForm = () => {
  const navigate = useNavigate();
  const { auth, setAuth } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  // personal
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // address
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [taluk, setTaluk] = useState("");
  const [urbanRural, setUrbanRural] = useState<"Urban" | "Rural" | "">("");

  // urban
  const [cmcType, setCmcType] = useState("");
  const [pattana, setPattana] = useState("");
  const [ward, setWard] = useState("");

  // rural
  const [gramPanchayathi, setGramPanchayathi] = useState("");
  const [village, setVillage] = useState("");

  // shared
  const [postOffice, setPostOffice] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);

  /* cascading lists */
  const districtOptions = division ? districtsByDivision[division] ?? [] : [];
  const talukOptions = district ? taluksByDistrict[district] ?? [] : [];
  const pattanaOptions = taluk ? pattanaPanchayathiByTaluk[taluk] ?? [] : [];
  const gpOptions = taluk ? gramPanchayathiByTaluk[taluk] ?? [] : [];
  const villageOptions = gramPanchayathi ? villagesByGP[gramPanchayathi] ?? [] : [];

  /* reset children on parent change */
  const handleDivision = (v: string) => {
    setDivision(v);
    setDistrict("");
    setTaluk("");
    resetAreaFields();
  };
  const handleDistrict = (v: string) => {
    setDistrict(v);
    setTaluk("");
    resetAreaFields();
  };
  const handleTaluk = (v: string) => {
    setTaluk(v);
    resetAreaFields();
  };
  const resetAreaFields = () => {
    setCmcType("");
    setPattana("");
    setWard("");
    setGramPanchayathi("");
    setVillage("");
  };

  /* photo */
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  /* generated address */
  const generatedAddress = useMemo(() => {
    const parts: string[] = [];
    if (urbanRural === "Urban") {
      if (cmcType) parts.push(cmcType);
      if (pattana) parts.push(pattana);
      if (ward) parts.push(ward);
    } else if (urbanRural === "Rural") {
      if (gramPanchayathi) parts.push(gramPanchayathi);
      if (village) parts.push(village);
    }
    if (taluk) parts.push(taluk);
    if (district) parts.push(district);
    if (division) parts.push(division);
    parts.push("KARNATAKA");
    if (pincode) parts.push(pincode);
    return parts.join(", ");
  }, [urbanRural, cmcType, pattana, ward, gramPanchayathi, village, taluk, district, division, pincode]);

  /* submit */
  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast({ title: "Full Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const clientType =
        auth.registrationType === "individual"
          ? "Personal"
          : auth.registrationType === "organization"
          ? "Organisation"
          : auth.registrationType;

      const body = {
        client_name: fullName,
        email,
        client_type: clientType,
        registration_type: auth.registrationType,
        client_state: "Karnataka",
        division,
        client_district: district,
        client_taluk: taluk,
        urban_rural: urbanRural,
        cmc_tmc_type: cmcType,
        pattana_panchayathi: pattana,
        ward,
        post_office: postOffice,
        client_pincode: pincode,
        full_address_review: generatedAddress,
        client_latitude: latitude,
        client_longitude: longitude,
        phone_no: auth.phone,
        otp_verified: 1,
        terms_accepted: 1,
        client_status: "Active",
      };

      const res = await createRecord("DigiVault Client", body);
      const clientId = res?.data?.name || "CL-00001";
      setAuth((prev) => ({ ...prev, client_id: clientId, name: fullName }));
      toast({ title: "Registration successful!" });
      navigate("/dashboard", { replace: true });
    } catch {
      toast({ title: "Registration failed. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* header */}
      <div className="sticky top-0 z-10 flex items-center bg-background border-b border-border px-4 h-14">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-11">Registration</h1>
      </div>

      {/* scrollable form */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-28 space-y-6">
        {/* ── Personal Details ── */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Personal Details</h2>

          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground">
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground">Email</label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground">Profile Photo</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-input bg-muted flex items-center justify-center overflow-hidden"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Camera size={28} className="text-muted-foreground" />
              )}
            </button>
          </div>
        </section>

        {/* ── Address ── */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Address</h2>

          <Dropdown label="State" value="Karnataka" onChange={() => {}} options={["Karnataka"]} disabled />
          <Dropdown label="Division" value={division} onChange={handleDivision} options={divisions} />
          <Dropdown label="District" value={district} onChange={handleDistrict} options={districtOptions} placeholder={division ? "Select District" : "Select Division first"} />
          <Dropdown label="Taluk" value={taluk} onChange={handleTaluk} options={talukOptions} placeholder={district ? "Select Taluk" : "Select District first"} />

          {/* Urban / Rural */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground underline">Select Urban / Rural</label>
            <div className="flex gap-6">
              {(["Urban", "Rural"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setUrbanRural(opt);
                    resetAreaFields();
                  }}
                  className="flex items-center gap-2 min-h-[44px]"
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      urbanRural === opt ? "border-primary" : "border-input"
                    }`}
                  >
                    {urbanRural === opt && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="text-sm text-foreground">{opt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Urban fields */}
          {urbanRural === "Urban" && (
            <div className="space-y-4">
              <Dropdown label="Select CMC/TMC/TP/GBA/MC" value={cmcType} onChange={setCmcType} options={cmcTmcOptions} />
              <Dropdown label="Select Pattana Panchayathi" value={pattana} onChange={setPattana} options={pattanaOptions} placeholder={taluk ? "Select Pattana Panchayathi" : "Select Taluk first"} />
              <Dropdown label="Urban" value={ward} onChange={setWard} options={urbanWards} placeholder="Select Ward" />
            </div>
          )}

          {/* Rural fields */}
          {urbanRural === "Rural" && (
            <div className="space-y-4">
              <Dropdown label="Select Gram Panchayathi" value={gramPanchayathi} onChange={setGramPanchayathi} options={gpOptions} placeholder={taluk ? "Select Gram Panchayathi" : "Select Taluk first"} />
              <Dropdown label="Village" value={village} onChange={setVillage} options={villageOptions} placeholder={gramPanchayathi ? "Select Village" : "Select GP first"} />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground">Post Office</label>
            <Input placeholder="Ilanthila" value={postOffice} onChange={(e) => setPostOffice(e.target.value)} className="h-12" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground">Pincode</label>
            <Input
              type="number"
              placeholder="560016"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.slice(0, 6))}
              maxLength={6}
              className="h-12"
            />
          </div>

          {/* Address review */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground">Address Review</label>
            <textarea
              readOnly
              value={generatedAddress}
              className="w-full min-h-[80px] rounded-lg border border-input bg-muted px-4 py-3 text-sm text-muted-foreground resize-none"
            />
          </div>

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

          <button className="flex items-center gap-2 text-sm text-primary min-h-[44px]">
            <MapPin size={18} className="text-destructive" />
            Select the location
          </button>
        </section>
      </div>

      {/* fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-5 py-4">
        <Button className="w-full h-12" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save & Next"}
        </Button>
      </div>
    </div>
  );
};

export default RegisterForm;
