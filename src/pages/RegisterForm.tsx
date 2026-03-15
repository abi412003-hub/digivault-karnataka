import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LocationPicker from "@/components/LocationPicker";
import { ArrowLeft, Camera, ChevronDown, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useFormDraft, hasDraft } from "@/hooks/useFormDraft";
import { validateForm, PATTERNS, type FormRules } from "@/lib/validation";
import { RequiredLabel, OptionalLabel } from "@/components/RequiredLabel";
import DraftIndicator from "@/components/DraftIndicator";
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
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}) => (
  <div className="space-y-1">
    {required ? <RequiredLabel>{label}</RequiredLabel> : <label className="text-sm font-bold text-foreground">{label}</label>}
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full h-12 appearance-none rounded-lg border bg-background px-4 pr-10 text-sm text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring ${
          error ? "border-destructive ring-1 ring-destructive" : "border-input"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const companyTypes = ["Pvt.Ltd", "LLP", "Partnership", "Proprietary", "Other"];
const revenueRanges = ["Below 50L", "50L-1Cr", "1Cr-1.5Cr", "1.5Cr-5Cr", "5Cr-10Cr", "Above 10Cr"];

const DRAFT_KEY = "register-form";

/* ── main form ──────────────────────────────────────────────── */
const RegisterForm = () => {
  const navigate = useNavigate();
  const { auth, setAuth, lookupClient } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const isOrgType =
    auth.registrationType === "Organization" ||
    auth.registrationType === "Land Aggregator - Organisation";

  const defaultValues = {
    fullName: "", email: "", companyName: "", companyType: "", gstinPan: "",
    businessRegNo: "", natureOfBusiness: "", companyWebsite: "", numEmployees: "",
    annualRevenue: "", dateOfEstablishment: "", ownerName: "", ownershipStatus: "",
    incorporationNumber: "", division: "", district: "", taluk: "",
    urbanRural: "" as "Urban" | "Rural" | "", cmcType: "", pattana: "", ward: "",
    gramPanchayathi: "", village: "", postOffice: "", pincode: "",
    latitude: "", longitude: "",
  };

  const hadDraft = useRef(hasDraft(DRAFT_KEY));
  const [form, setField, clearDraft, setMultiple, lastSaved] = useFormDraft(DRAFT_KEY, defaultValues);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeBtn, setShakeBtn] = useState(false);

  useEffect(() => {
    if (hadDraft.current) {
      toast({ title: "Draft found — continuing your registration" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartFresh = () => {
    clearDraft();
    setMultiple(defaultValues);
    setErrors({});
  };

  /* cascading lists */
  const districtOptions = form.division ? districtsByDivision[form.division] ?? [] : [];
  const talukOptions = form.district ? taluksByDistrict[form.district] ?? [] : [];
  const pattanaOptions = form.taluk ? pattanaPanchayathiByTaluk[form.taluk] ?? [] : [];
  const gpOptions = form.taluk ? gramPanchayathiByTaluk[form.taluk] ?? [] : [];
  const villageOptions = form.gramPanchayathi ? villagesByGP[form.gramPanchayathi] ?? [] : [];

  const handleDivision = (v: string) => {
    setMultiple({ division: v, district: "", taluk: "", cmcType: "", pattana: "", ward: "", gramPanchayathi: "", village: "" } as any);
  };
  const handleDistrict = (v: string) => {
    setMultiple({ district: v, taluk: "", cmcType: "", pattana: "", ward: "", gramPanchayathi: "", village: "" } as any);
  };
  const handleTaluk = (v: string) => {
    setMultiple({ taluk: v, cmcType: "", pattana: "", ward: "", gramPanchayathi: "", village: "" } as any);
  };
  const handleUrbanRural = (v: "Urban" | "Rural") => {
    setMultiple({ urbanRural: v, cmcType: "", pattana: "", ward: "", gramPanchayathi: "", village: "" } as any);
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
    if (form.urbanRural === "Urban") {
      if (form.cmcType) parts.push(form.cmcType);
      if (form.pattana) parts.push(form.pattana);
      if (form.ward) parts.push(form.ward);
    } else if (form.urbanRural === "Rural") {
      if (form.gramPanchayathi) parts.push(form.gramPanchayathi);
      if (form.village) parts.push(form.village);
    }
    if (form.taluk) parts.push(form.taluk);
    if (form.district) parts.push(form.district);
    if (form.division) parts.push(form.division);
    parts.push("KARNATAKA");
    if (form.pincode) parts.push(form.pincode);
    return parts.join(", ");
  }, [form.urbanRural, form.cmcType, form.pattana, form.ward, form.gramPanchayathi, form.village, form.taluk, form.district, form.division, form.pincode]);

  /* scroll to first error */
  const scrollToFirstError = useCallback((errs: Record<string, string>) => {
    const firstKey = Object.keys(errs)[0];
    if (!firstKey || !formRef.current) return;
    const el = formRef.current.querySelector(`[data-field="${firstKey}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  /* validate */
  const runValidation = (): boolean => {
    const rules: FormRules = {};

    if (isOrgType) {
      rules.companyName = { required: true, minLength: 2, message: "Company name is required" };
      if (form.gstinPan) {
        rules.gstinPan = { pattern: /^[A-Z0-9]{15}$/i, message: "GSTIN must be 15 alphanumeric characters" };
      }
    } else {
      rules.fullName = { required: true, minLength: 2, message: "Full name is required" };
    }

    if (form.email) {
      rules.email = { pattern: PATTERNS.email, message: "Enter a valid email" };
    }

    rules.division = { required: true, message: "Please select a division" };
    rules.district = { required: true, message: "Please select a district" };
    rules.taluk = { required: true, message: "Please select a taluk" };
    rules.urbanRural = { required: true, message: "Please select Urban or Rural" };
    rules.pincode = { required: true, pattern: PATTERNS.pincode, message: "Enter a valid 6-digit pincode" };

    if (form.urbanRural === "Urban") {
      rules.cmcType = { required: true, message: "Please select CMC/TMC type" };
      rules.pattana = { required: true, message: "Please select Pattana Panchayathi" };
    }
    if (form.urbanRural === "Rural") {
      rules.gramPanchayathi = { required: true, message: "Please select Gram Panchayathi" };
    }

    const result = validateForm(form, rules);
    setErrors(result.errors);

    if (!result.valid) {
      setShakeBtn(true);
      setTimeout(() => setShakeBtn(false), 400);
      scrollToFirstError(result.errors);
    }
    return result.valid;
  };

  /* ── Address section (shared) ── */
  const AddressSection = ({ heading = "Address" }: { heading?: string }) => (
    <section className="space-y-4">
      <h2 className="text-base font-bold text-foreground">{heading}</h2>

      <Dropdown label="State" value="Karnataka" onChange={() => {}} options={["Karnataka"]} disabled />
      <div data-field="division">
        <Dropdown label="Division" value={form.division} onChange={handleDivision} options={divisions} required error={errors.division} />
      </div>
      <div data-field="district">
        <Dropdown label="District" value={form.district} onChange={handleDistrict} options={districtOptions} placeholder={form.division ? "Select District" : "Select Division first"} required error={errors.district} />
      </div>
      <div data-field="taluk">
        <Dropdown label="Taluk" value={form.taluk} onChange={handleTaluk} options={talukOptions} placeholder={form.district ? "Select Taluk" : "Select District first"} required error={errors.taluk} />
      </div>

      <div className="space-y-2" data-field="urbanRural">
        <RequiredLabel>Select Urban / Rural</RequiredLabel>
        <div className="flex gap-6">
          {(["Urban", "Rural"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => handleUrbanRural(opt)}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.urbanRural === opt ? "border-primary" : "border-input"}`}>
                {form.urbanRural === opt && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </span>
              <span className="text-sm text-foreground">{opt}</span>
            </button>
          ))}
        </div>
        {errors.urbanRural && <p className="text-xs text-destructive mt-1">{errors.urbanRural}</p>}
      </div>

      {form.urbanRural === "Urban" && (
        <div className="space-y-4">
          <div data-field="cmcType">
            <Dropdown label="Select CMC/TMC/TP/GBA/MC" value={form.cmcType} onChange={(v) => setField("cmcType", v)} options={cmcTmcOptions} required error={errors.cmcType} />
          </div>
          <div data-field="pattana">
            <Dropdown label="Select Pattana Panchayathi" value={form.pattana} onChange={(v) => setField("pattana", v)} options={pattanaOptions} placeholder={form.taluk ? "Select Pattana Panchayathi" : "Select Taluk first"} required error={errors.pattana} />
          </div>
          <Dropdown label="Urban Ward" value={form.ward} onChange={(v) => setField("ward", v)} options={urbanWards} placeholder="Select Ward" />
        </div>
      )}

      {form.urbanRural === "Rural" && (
        <div className="space-y-4">
          <div data-field="gramPanchayathi">
            <Dropdown label="Select Gram Panchayathi" value={form.gramPanchayathi} onChange={(v) => setField("gramPanchayathi", v)} options={gpOptions} placeholder={form.taluk ? "Select Gram Panchayathi" : "Select Taluk first"} required error={errors.gramPanchayathi} />
          </div>
          <Dropdown label="Village" value={form.village} onChange={(v) => setField("village", v)} options={villageOptions} placeholder={form.gramPanchayathi ? "Select Village" : "Select GP first"} />
        </div>
      )}

      <div className="space-y-1">
        <OptionalLabel>Post Office</OptionalLabel>
        <Input placeholder="Ilanthila" value={form.postOffice} onChange={(e) => setField("postOffice", e.target.value)} className="h-12" />
      </div>

      <div className="space-y-1" data-field="pincode">
        <RequiredLabel>Pincode</RequiredLabel>
        <Input
          type="number"
          placeholder="560016"
          value={form.pincode}
          onChange={(e) => setField("pincode", e.target.value.slice(0, 6))}
          maxLength={6}
          className={`h-12 ${errors.pincode ? "border-destructive ring-1 ring-destructive" : ""}`}
        />
        {errors.pincode && <p className="text-xs text-destructive mt-1">{errors.pincode}</p>}
      </div>

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
          <OptionalLabel>Latitude</OptionalLabel>
          <Input placeholder="12.9716" value={form.latitude} onChange={(e) => setField("latitude", e.target.value)} className="h-12" />
        </div>
        <div className="space-y-1">
          <OptionalLabel>Longitude</OptionalLabel>
          <Input placeholder="77.5946" value={form.longitude} onChange={(e) => setField("longitude", e.target.value)} className="h-12" />
        </div>
      </div>

      <button
        onClick={() => setShowMap(true)}
        className="flex items-center gap-2 text-sm text-primary min-h-[44px]"
      >
        <MapPin size={18} className="text-destructive" />
        {form.latitude && form.longitude
          ? `📍 ${Number(form.latitude).toFixed(4)}°N, ${Number(form.longitude).toFixed(4)}°E`
          : "Select the location"}
      </button>
    </section>
  );

  /* submit */
  const handleSubmit = async () => {
    if (!runValidation()) return;

    setSaving(true);
    try {
      const existing = await lookupClient(auth.phone);
      if (existing) {
        setAuth({
          client_id: existing.name,
          name: existing.client_name,
          phone: auth.phone,
          registrationType: existing.registration_type || auth.registrationType,
          supabaseUserId: auth.supabaseUserId || "",
        });
        clearDraft();
        toast({ title: `Account already exists. Welcome back, ${existing.client_name}!` });
        navigate("/dashboard", { replace: true });
        return;
      }

      if (isOrgType) {
        const orgBody: Record<string, unknown> = {
          company_name: form.companyName,
          company_type: form.companyType,
          gstin_pan: form.gstinPan,
          business_registration_number: form.businessRegNo,
          nature_of_business: form.natureOfBusiness,
          company_website: form.companyWebsite,
          number_of_employees: form.numEmployees ? Number(form.numEmployees) : undefined,
          annual_revenue_range: form.annualRevenue,
          date_of_establishment: form.dateOfEstablishment || undefined,
          owner_name: form.ownerName,
          ownership_status: form.ownershipStatus,
          incorporation_number: form.incorporationNumber,
          office_address: generatedAddress,
          org_state: "Karnataka",
          org_district: form.district,
          org_taluk: form.taluk,
          org_pincode: form.pincode,
        };
        Object.keys(orgBody).forEach((k) => orgBody[k] === undefined && delete orgBody[k]);

        let orgName: string;
        try {
          const orgRes = await createRecord("DigiVault Organisation", orgBody);
          orgName = orgRes?.data?.name;
          if (!orgName) throw new Error("Organisation creation returned no name");
        } catch {
          toast({ title: "Failed to create organisation. Please try again.", variant: "destructive" });
          setSaving(false);
          return;
        }

        const clientBody = {
          client_name: form.companyName, email: form.email, client_type: "Organisation",
          registration_type: auth.registrationType, organisation_link: orgName,
          client_state: "Karnataka", division: form.division, client_district: form.district,
          client_taluk: form.taluk, urban_rural: form.urbanRural, cmc_tmc_type: form.cmcType,
          pattana_panchayathi: form.pattana, ward: form.ward, post_office: form.postOffice,
          client_pincode: form.pincode, full_address_review: generatedAddress,
          client_latitude: form.latitude, client_longitude: form.longitude,
          phone_no: auth.phone, otp_verified: 1, terms_accepted: 1, client_status: "Active",
        };

        const res = await createRecord("DigiVault Client", clientBody);
        const clientId = res?.data?.name || "CL-00001";
        setAuth((prev) => ({ ...prev, client_id: clientId, name: form.companyName, supabaseUserId: prev.supabaseUserId || "" }));
        clearDraft();
        toast({ title: "Registration successful!" });
        navigate("/dashboard", { replace: true });
      } else {
        const body = {
          client_name: form.fullName, email: form.email, client_type: "Personal",
          registration_type: auth.registrationType, client_state: "Karnataka",
          division: form.division, client_district: form.district, client_taluk: form.taluk,
          urban_rural: form.urbanRural, cmc_tmc_type: form.cmcType,
          pattana_panchayathi: form.pattana, ward: form.ward, post_office: form.postOffice,
          client_pincode: form.pincode, full_address_review: generatedAddress,
          client_latitude: form.latitude, client_longitude: form.longitude,
          phone_no: auth.phone, otp_verified: 1, terms_accepted: 1, client_status: "Active",
        };

        const res = await createRecord("DigiVault Client", body);
        const clientId = res?.data?.name || "CL-00001";
        setAuth((prev) => ({ ...prev, client_id: clientId, name: form.fullName, supabaseUserId: prev.supabaseUserId || "" }));
        clearDraft();
        toast({ title: "Registration successful!" });
        navigate("/dashboard", { replace: true });
      }
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
      <div ref={formRef} className="flex-1 overflow-y-auto px-5 py-6 pb-28 space-y-6">
        <DraftIndicator lastSaved={lastSaved} onStartFresh={handleStartFresh} showStartFresh={hadDraft.current} />

        {isOrgType ? (
          <>
            {/* ── Organisation Details ── */}
            <section className="space-y-4">
              <h2 className="text-base font-bold text-foreground">Organisation Details</h2>

              <div className="space-y-1" data-field="companyName">
                <RequiredLabel>Company Name</RequiredLabel>
                <Input
                  placeholder="Enter company name"
                  value={form.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                  className={`h-12 ${errors.companyName ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName}</p>}
              </div>

              <Dropdown label="Company Type" value={form.companyType} onChange={(v) => setField("companyType", v)} options={companyTypes} placeholder="Select Company Type" />

              <div className="space-y-1" data-field="gstinPan">
                <OptionalLabel>GSTIN / PAN</OptionalLabel>
                <Input
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={form.gstinPan}
                  onChange={(e) => setField("gstinPan", e.target.value.toUpperCase().slice(0, 15))}
                  className={`h-12 ${errors.gstinPan ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.gstinPan && <p className="text-xs text-destructive mt-1">{errors.gstinPan}</p>}
              </div>

              <div className="space-y-1">
                <OptionalLabel>Business Registration Number</OptionalLabel>
                <Input placeholder="Enter registration number" value={form.businessRegNo} onChange={(e) => setField("businessRegNo", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <OptionalLabel>Nature of Business</OptionalLabel>
                <Input placeholder="e.g. Real Estate, Agriculture" value={form.natureOfBusiness} onChange={(e) => setField("natureOfBusiness", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <OptionalLabel>Company Website</OptionalLabel>
                <Input placeholder="https://example.com" value={form.companyWebsite} onChange={(e) => setField("companyWebsite", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <OptionalLabel>Number of Employees</OptionalLabel>
                <Input type="number" placeholder="e.g. 50" value={form.numEmployees} onChange={(e) => setField("numEmployees", e.target.value)} className="h-12" />
              </div>

              <Dropdown label="Annual Revenue Range" value={form.annualRevenue} onChange={(v) => setField("annualRevenue", v)} options={revenueRanges} placeholder="Select Range" />

              <div className="space-y-1">
                <OptionalLabel>Date of Establishment</OptionalLabel>
                <Input type="date" value={form.dateOfEstablishment} onChange={(e) => setField("dateOfEstablishment", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <OptionalLabel>Owner Name</OptionalLabel>
                <Input placeholder="Enter owner name" value={form.ownerName} onChange={(e) => setField("ownerName", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <OptionalLabel>Ownership Status</OptionalLabel>
                <Input placeholder="e.g. Sole Proprietor, Partner" value={form.ownershipStatus} onChange={(e) => setField("ownershipStatus", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <OptionalLabel>Incorporation Number</OptionalLabel>
                <Input placeholder="Optional" value={form.incorporationNumber} onChange={(e) => setField("incorporationNumber", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1" data-field="email">
                <OptionalLabel>Email</OptionalLabel>
                <Input
                  type="email"
                  placeholder="Enter company email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className={`h-12 ${errors.email ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
            </section>

            <div className="border-t border-border" />
            <AddressSection heading="Office Address" />
          </>
        ) : (
          <>
            {/* ── Personal Details (Individual) ── */}
            <section className="space-y-4">
              <h2 className="text-base font-bold text-foreground">Personal Details</h2>

              <div className="space-y-1" data-field="fullName">
                <RequiredLabel>Full Name</RequiredLabel>
                <Input
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  className={`h-12 ${errors.fullName ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
              </div>

              <div className="space-y-1" data-field="email">
                <OptionalLabel>Email</OptionalLabel>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className={`h-12 ${errors.email ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <OptionalLabel>Profile Photo</OptionalLabel>
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

            <AddressSection />
          </>
        )}
      </div>

      {/* fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-5 py-4">
        <Button
          className={`w-full h-12 ${shakeBtn ? "animate-[shake_0.3s]" : ""}`}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save & Next"}
        </Button>
      </div>
      <LocationPicker
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onSelect={(lat, lng) => {
          setMultiple({ latitude: String(lat.toFixed(6)), longitude: String(lng.toFixed(6)) });
          setShowMap(false);
        }}
        initialLat={form.latitude ? Number(form.latitude) : undefined}
        initialLng={form.longitude ? Number(form.longitude) : undefined}
      />
    </div>
  );
};

export default RegisterForm;
