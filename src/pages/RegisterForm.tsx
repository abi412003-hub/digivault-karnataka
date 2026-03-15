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
import { RequiredLabel } from "@/components/RequiredLabel";
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
    salutation: "Mr", fullName: "", relationType: "S/O", relationName: "",
    dateOfBirth: "", age: "", email: "", whatsappNo: "",
    aadhaarNo: "", panNo: "",
    companyName: "", companyType: "", gstinPan: "",
    businessRegNo: "", natureOfBusiness: "", companyWebsite: "", numEmployees: "",
    annualRevenue: "", dateOfEstablishment: "", ownerName: "", ownershipStatus: "",
    incorporationNumber: "",
    doorNo: "", buildingName: "", crossRoad: "", mainRoad: "", landmark: "", areaName: "",
    division: "", district: "", taluk: "",
    urbanRural: "" as "Urban" | "Rural" | "", cmcType: "", pattana: "", ward: "",
    gramPanchayathi: "", village: "", postOffice: "", pincode: "",
    latitude: "", longitude: "", bdReferralCode: "",
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
    if (form.doorNo) parts.push(form.doorNo);
    if (form.buildingName) parts.push(form.buildingName);
    if (form.crossRoad) parts.push(form.crossRoad);
    if (form.mainRoad) parts.push(form.mainRoad);
    if (form.landmark) parts.push("near " + form.landmark);
    if (form.areaName) parts.push(form.areaName);
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
  }, [form.doorNo, form.buildingName, form.crossRoad, form.mainRoad, form.landmark, form.areaName, form.urbanRural, form.cmcType, form.pattana, form.ward, form.gramPanchayathi, form.village, form.taluk, form.district, form.division, form.pincode]);

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
      rules.companyType = { required: true, message: "Company type is required" };
      rules.gstinPan = { required: true, pattern: /^[A-Z0-9]{15}$/i, message: "GSTIN must be 15 alphanumeric characters" };
      rules.businessRegNo = { required: true, message: "Business registration number is required" };
      rules.natureOfBusiness = { required: true, message: "Nature of business is required" };
      rules.companyWebsite = { required: true, message: "Company website is required" };
      rules.numEmployees = { required: true, message: "Number of employees is required" };
      rules.annualRevenue = { required: true, message: "Annual revenue range is required" };
      rules.dateOfEstablishment = { required: true, message: "Date of establishment is required" };
      rules.ownerName = { required: true, message: "Owner name is required" };
      rules.ownershipStatus = { required: true, message: "Ownership status is required" };
      rules.incorporationNumber = { required: true, message: "Incorporation number is required" };
      rules.email = { required: true, pattern: PATTERNS.email, message: "Enter a valid email" };
    } else {
      rules.fullName = { required: true, minLength: 2, message: "Full name is required" };
      rules.relationName = { required: true, message: "Relation name is required" };
      rules.dateOfBirth = { required: true, message: "Date of birth is required" };
      rules.age = { required: true, message: "Age is required" };
      rules.email = { required: true, pattern: PATTERNS.email, message: "Enter a valid email" };
      rules.whatsappNo = { required: true, message: "WhatsApp number is required" };
      rules.aadhaarNo = { required: true, pattern: /^\d{4}\s?\d{4}\s?\d{4}$/, message: "Enter valid 12-digit Aadhaar" };
      rules.panNo = { required: true, pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, message: "Enter valid PAN (e.g. ABCDE1234F)" };
      rules.doorNo = { required: true, message: "Door number is required" };
      rules.buildingName = { required: true, message: "Building name is required" };
      rules.crossRoad = { required: true, message: "Cross road is required" };
      rules.mainRoad = { required: true, message: "Main road is required" };
      rules.landmark = { required: true, message: "Landmark is required" };
      rules.areaName = { required: true, message: "Area name is required" };
    }

    rules.division = { required: true, message: "Please select a zone/division" };
    rules.district = { required: true, message: "Please select a district" };
    rules.taluk = { required: true, message: "Please select a taluk" };
    rules.urbanRural = { required: true, message: "Please select Urban or Rural" };
    rules.pincode = { required: true, pattern: PATTERNS.pincode, message: "Enter a valid 6-digit pincode" };
    rules.postOffice = { required: true, message: "Post office is required" };
    rules.bdReferralCode = { required: true, message: "BD Referral Code is required" };

    if (form.urbanRural === "Urban") {
      rules.cmcType = { required: true, message: "Please select CMC/TMC type" };
      rules.pattana = { required: true, message: "Please select Pattana Panchayathi" };
      rules.ward = { required: true, message: "Ward number is required" };
    }
    if (form.urbanRural === "Rural") {
      rules.gramPanchayathi = { required: true, message: "Please select Gram Panchayathi" };
      rules.village = { required: true, message: "Village is required" };
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

      {/* Detailed address fields */}
      {!isOrgType && (
        <>
          <div className="space-y-1" data-field="doorNo">
            <RequiredLabel>Door No</RequiredLabel>
            <Input placeholder="#18" value={form.doorNo} onChange={(e) => setField("doorNo", e.target.value)} className={`h-12 ${errors.doorNo ? "border-destructive ring-1 ring-destructive" : ""}`} />
            {errors.doorNo && <p className="text-xs text-destructive mt-1">{errors.doorNo}</p>}
          </div>
          <div className="space-y-1">
            <RequiredLabel>Building Name</RequiredLabel>
            <Input placeholder="Lakshmi Nivasa" value={form.buildingName} onChange={(e) => setField("buildingName", e.target.value)} className={`h-12 ${errors.buildingName ? "border-destructive ring-1 ring-destructive" : ""}`} />
          </div>
            {errors.buildingName && <p className="text-xs text-destructive mt-1">{errors.buildingName}</p>}
          <div className="space-y-1">
            <RequiredLabel>Cross Road</RequiredLabel>
            <Input placeholder="2nd Cross" value={form.crossRoad} onChange={(e) => setField("crossRoad", e.target.value)} className={`h-12 ${errors.crossRoad ? "border-destructive ring-1 ring-destructive" : ""}`} />
          </div>
            {errors.crossRoad && <p className="text-xs text-destructive mt-1">{errors.crossRoad}</p>}
          <div className="space-y-1">
            <RequiredLabel>Main Road</RequiredLabel>
            <Input placeholder="Bannerghatta Main" value={form.mainRoad} onChange={(e) => setField("mainRoad", e.target.value)} className={`h-12 ${errors.mainRoad ? "border-destructive ring-1 ring-destructive" : ""}`} />
          </div>
            {errors.mainRoad && <p className="text-xs text-destructive mt-1">{errors.mainRoad}</p>}
          <div className="space-y-1">
            <RequiredLabel>Landmark</RequiredLabel>
            <Input placeholder="Near Meenakshi Temple" value={form.landmark} onChange={(e) => setField("landmark", e.target.value)} className={`h-12 ${errors.landmark ? "border-destructive ring-1 ring-destructive" : ""}`} />
          </div>
            {errors.landmark && <p className="text-xs text-destructive mt-1">{errors.landmark}</p>}
          <div className="space-y-1" data-field="areaName">
            <RequiredLabel>Area Name</RequiredLabel>
            <Input placeholder="Arekere MICO Layout" value={form.areaName} onChange={(e) => setField("areaName", e.target.value)} className={`h-12 ${errors.areaName ? "border-destructive ring-1 ring-destructive" : ""}`} />
            {errors.areaName && <p className="text-xs text-destructive mt-1">{errors.areaName}</p>}
          </div>
        </>
      )}

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
          <Dropdown label="Urban Ward" value={form.ward} onChange={(v) => setField("ward", v)} options={urbanWards} placeholder="Select Ward" required error={errors.ward} />
        </div>
      )}

      {form.urbanRural === "Rural" && (
        <div className="space-y-4">
          <div data-field="gramPanchayathi">
            <Dropdown label="Select Gram Panchayathi" value={form.gramPanchayathi} onChange={(v) => setField("gramPanchayathi", v)} options={gpOptions} placeholder={form.taluk ? "Select Gram Panchayathi" : "Select Taluk first"} required error={errors.gramPanchayathi} />
          </div>
          <Dropdown label="Village" value={form.village} onChange={(v) => setField("village", v)} options={villageOptions} placeholder={form.gramPanchayathi ? "Select Village" : "Select GP first"} required error={errors.village} />
        </div>
      )}

      <div className="space-y-1">
        <RequiredLabel>Post Office</RequiredLabel>
        <Input placeholder="Ilanthila" value={form.postOffice} onChange={(e) => setField("postOffice", e.target.value)} className="h-12" />
      </div>
            {errors.postOffice && <p className="text-xs text-destructive mt-1">{errors.postOffice}</p>}

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
          <RequiredLabel>Latitude</RequiredLabel>
          <Input placeholder="12.9716" value={form.latitude} onChange={(e) => setField("latitude", e.target.value)} className="h-12" />
        </div>
        <div className="space-y-1">
          <RequiredLabel>Longitude</RequiredLabel>
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

      {/* BD Referral Code */}
      <div className="space-y-1">
        <RequiredLabel>BD Referral Code</RequiredLabel>
        <div className="flex gap-2">
          <Input
            placeholder="Type / Scan"
            value={form.bdReferralCode}
            onChange={(e) => setField("bdReferralCode", e.target.value)}
            className="h-12 flex-1"
          />
          <button className="h-12 w-12 rounded-lg border border-input bg-background flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
          </button>
        </div>
            {errors.bdReferralCode && <p className="text-xs text-destructive mt-1">{errors.bdReferralCode}</p>}
      </div>
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
        navigate("/create-project", { replace: true });
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
        navigate("/create-project", { replace: true });
      } else {
        const body = {
          client_name: form.fullName, salutation: form.salutation,
          relation_type: form.relationType, relation_name: form.relationName,
          date_of_birth: form.dateOfBirth || undefined,
          age: form.age ? Number(form.age) : undefined,
          email: form.email, phone_no: auth.phone,
          whatsapp_no: form.whatsappNo ? "+91" + form.whatsappNo : undefined,
          aadhaar_no: form.aadhaarNo.replace(/\s/g, ""),
          pan_no: form.panNo.toUpperCase(),
          door_no: form.doorNo, building_name: form.buildingName,
          cross_road: form.crossRoad, main_road: form.mainRoad,
          landmark: form.landmark, area_name: form.areaName,
          client_type: "Personal",
          registration_type: auth.registrationType, client_state: "Karnataka",
          division: form.division, client_district: form.district, client_taluk: form.taluk,
          urban_rural: form.urbanRural, cmc_tmc_type: form.cmcType,
          pattana_panchayathi: form.pattana, ward: form.ward,
          gram_panchayathi: form.gramPanchayathi, village: form.village,
          post_office: form.postOffice,
          client_pincode: form.pincode, full_address_review: generatedAddress,
          client_latitude: form.latitude || undefined,
          client_longitude: form.longitude || undefined,
          bd_referral_code: form.bdReferralCode || undefined,
          otp_verified: 1, terms_accepted: 1, client_status: "Active",
        };
        Object.keys(body).forEach((k) => (body as any)[k] === undefined && delete (body as any)[k]);

        const res = await createRecord("DigiVault Client", body);
        const clientId = res?.data?.name || "CL-00001";
        setAuth((prev) => ({ ...prev, client_id: clientId, name: form.fullName, supabaseUserId: prev.supabaseUserId || "" }));
        clearDraft();
        toast({ title: "Registration successful!" });
        navigate("/create-project", { replace: true });
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
                <RequiredLabel>GSTIN / PAN</RequiredLabel>
                <Input
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={form.gstinPan}
                  onChange={(e) => setField("gstinPan", e.target.value.toUpperCase().slice(0, 15))}
                  className={`h-12 ${errors.gstinPan ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.gstinPan && <p className="text-xs text-destructive mt-1">{errors.gstinPan}</p>}
              </div>

              <div className="space-y-1">
                <RequiredLabel>Business Registration Number</RequiredLabel>
                <Input placeholder="Enter registration number" value={form.businessRegNo} onChange={(e) => setField("businessRegNo", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <RequiredLabel>Nature of Business</RequiredLabel>
                <Input placeholder="e.g. Real Estate, Agriculture" value={form.natureOfBusiness} onChange={(e) => setField("natureOfBusiness", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <RequiredLabel>Company Website</RequiredLabel>
                <Input placeholder="https://example.com" value={form.companyWebsite} onChange={(e) => setField("companyWebsite", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <RequiredLabel>Number of Employees</RequiredLabel>
                <Input type="number" placeholder="e.g. 50" value={form.numEmployees} onChange={(e) => setField("numEmployees", e.target.value)} className="h-12" />
              </div>

              <Dropdown label="Annual Revenue Range" value={form.annualRevenue} onChange={(v) => setField("annualRevenue", v)} options={revenueRanges} placeholder="Select Range" />

              <div className="space-y-1">
                <RequiredLabel>Date of Establishment</RequiredLabel>
                <Input type="date" value={form.dateOfEstablishment} onChange={(e) => setField("dateOfEstablishment", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <RequiredLabel>Owner Name</RequiredLabel>
                <Input placeholder="Enter owner name" value={form.ownerName} onChange={(e) => setField("ownerName", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <RequiredLabel>Ownership Status</RequiredLabel>
                <Input placeholder="e.g. Sole Proprietor, Partner" value={form.ownershipStatus} onChange={(e) => setField("ownershipStatus", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1">
                <RequiredLabel>Incorporation Number</RequiredLabel>
                <Input placeholder="Optional" value={form.incorporationNumber} onChange={(e) => setField("incorporationNumber", e.target.value)} className="h-12" />
              </div>

              <div className="space-y-1" data-field="email">
                <RequiredLabel>Email</RequiredLabel>
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

              {/* Full Name: Salutation + Name side by side */}
              <div className="space-y-1" data-field="fullName">
                <RequiredLabel>Full Name</RequiredLabel>
                <div className="flex gap-2">
                  <select
                    value={form.salutation}
                    onChange={(e) => setField("salutation", e.target.value)}
                    className="w-[80px] h-12 appearance-none rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {["Mr", "Mrs", "Ms", "Dr"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Input
                    placeholder="Rajesh Kumar"
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    className={`h-12 flex-1 ${errors.fullName ? "border-destructive ring-1 ring-destructive" : ""}`}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
              </div>

              {/* Relation Name: S/O + Name side by side */}
              <div className="space-y-1" data-field="relationName">
                <RequiredLabel>Relation Name</RequiredLabel>
                <div className="flex gap-2">
                  <select
                    value={form.relationType}
                    onChange={(e) => setField("relationType", e.target.value)}
                    className="w-[80px] h-12 appearance-none rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {["S/O", "D/O", "W/O", "C/O"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <Input
                    placeholder="Kumar Rao"
                    value={form.relationName}
                    onChange={(e) => setField("relationName", e.target.value)}
                    className={`h-12 flex-1 ${errors.relationName ? "border-destructive ring-1 ring-destructive" : ""}`}
                  />
                </div>
                {errors.relationName && <p className="text-xs text-destructive mt-1">{errors.relationName}</p>}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1" data-field="dateOfBirth">
                <RequiredLabel>Date of Birth</RequiredLabel>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => {
                    setField("dateOfBirth", e.target.value);
                    if (e.target.value) {
                      const dob = new Date(e.target.value);
                      const today = new Date();
                      let a = today.getFullYear() - dob.getFullYear();
                      const m = today.getMonth() - dob.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
                      setField("age", String(Math.max(0, a)));
                    }
                  }}
                  className={`h-12 ${errors.dateOfBirth ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth}</p>}
              </div>
            {errors.age && <p className="text-xs text-destructive mt-1">{errors.age}</p>}

              {/* Age (auto-calculated, editable) */}
              <div className="space-y-1">
                <RequiredLabel>Age</RequiredLabel>
                <Input
                  type="number"
                  placeholder="24"
                  value={form.age}
                  onChange={(e) => setField("age", e.target.value.slice(0, 3))}
                  className="h-12 w-24"
                />
              </div>

              {/* Profile Photo */}
              <div className="space-y-1">
                <RequiredLabel>Profile Photo</RequiredLabel>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 w-full h-12 rounded-lg border border-input bg-background px-4"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <Camera size={20} className="text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {photoPreview ? "Photo selected" : "choose the Profile Photo"}
                  </span>
                </button>
              </div>

              {/* Email */}
              <div className="space-y-1" data-field="email">
                <RequiredLabel>Email</RequiredLabel>
                <Input
                  type="email"
                  placeholder="Rajeshkumar@gmail.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className={`h-12 ${errors.email ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              {/* Phone No (pre-filled from OTP, read-only) */}
              <div className="space-y-1">
                <RequiredLabel>Phone No</RequiredLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
                  <Input
                    value={auth.phone?.replace("+91", "") || ""}
                    readOnly
                    className="h-12 pl-12 bg-muted cursor-not-allowed"
                  />
                </div>
              </div>

              {/* WhatsApp No */}
              <div className="space-y-1">
                <RequiredLabel>WhatsApp No</RequiredLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
                  <Input
                    placeholder="9400 8138 02"
                    value={form.whatsappNo}
                    onChange={(e) => setField("whatsappNo", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="h-12 pl-12"
                  />
                </div>
            {errors.whatsappNo && <p className="text-xs text-destructive mt-1">{errors.whatsappNo}</p>}
                <button
                  type="button"
                  onClick={() => setField("whatsappNo", auth.phone?.replace("+91", "") || "")}
                  className="text-xs text-primary mt-0.5"
                >
                  Same as Phone No
                </button>
              </div>

              {/* Aadhaar No */}
              <div className="space-y-1" data-field="aadhaarNo">
                <RequiredLabel>Aadhaar No</RequiredLabel>
                <Input
                  placeholder="9446 8334 9230"
                  value={form.aadhaarNo}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                    setField("aadhaarNo", formatted);
                  }}
                  className={`h-12 ${errors.aadhaarNo ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.aadhaarNo && <p className="text-xs text-destructive mt-1">{errors.aadhaarNo}</p>}
              </div>

              {/* PAN No */}
              <div className="space-y-1" data-field="panNo">
                <RequiredLabel>PAN No</RequiredLabel>
                <Input
                  placeholder="OHAP55725P"
                  value={form.panNo}
                  onChange={(e) => setField("panNo", e.target.value.toUpperCase().slice(0, 10))}
                  className={`h-12 ${errors.panNo ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.panNo && <p className="text-xs text-destructive mt-1">{errors.panNo}</p>}
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
