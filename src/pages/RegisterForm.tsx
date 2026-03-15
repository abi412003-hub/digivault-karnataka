import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import LocationPicker from "@/components/LocationPicker";
import { ArrowLeft, Camera, ChevronDown, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { hasDraft } from "@/hooks/useFormDraft";
import { PATTERNS } from "@/lib/validation";
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
const STORAGE_KEY = `edv_draft_${DRAFT_KEY}`;

type FormValues = {
  salutation: string; fullName: string; relationType: string; relationName: string;
  dateOfBirth: string; age: string; email: string; whatsappNo: string;
  aadhaarNo: string; panNo: string;
  companyName: string; companyType: string; gstinPan: string;
  businessRegNo: string; natureOfBusiness: string; companyWebsite: string; numEmployees: string;
  annualRevenue: string; dateOfEstablishment: string; ownerName: string; ownershipStatus: string;
  incorporationNumber: string;
  doorNo: string; buildingName: string; crossRoad: string; mainRoad: string; landmark: string; areaName: string;
  division: string; district: string; taluk: string;
  urbanRural: "" | "Urban" | "Rural"; cmcType: string; pattana: string; ward: string;
  gramPanchayathi: string; village: string; postOffice: string; pincode: string;
  latitude: string; longitude: string; bdReferralCode: string;
};

const defaultValues: FormValues = {
  salutation: "Mr", fullName: "", relationType: "S/O", relationName: "",
  dateOfBirth: "", age: "", email: "", whatsappNo: "",
  aadhaarNo: "", panNo: "",
  companyName: "", companyType: "", gstinPan: "",
  businessRegNo: "", natureOfBusiness: "", companyWebsite: "", numEmployees: "",
  annualRevenue: "", dateOfEstablishment: "", ownerName: "", ownershipStatus: "",
  incorporationNumber: "",
  doorNo: "", buildingName: "", crossRoad: "", mainRoad: "", landmark: "", areaName: "",
  division: "", district: "", taluk: "",
  urbanRural: "", cmcType: "", pattana: "", ward: "",
  gramPanchayathi: "", village: "", postOffice: "", pincode: "",
  latitude: "", longitude: "", bdReferralCode: "",
};

function loadDraft(): Partial<FormValues> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {};
}

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

  const hadDraft = useRef(hasDraft(DRAFT_KEY));
  const savedDraft = useRef(loadDraft());

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { ...defaultValues, ...savedDraft.current },
    mode: "onSubmit",
  });

  const formValues = watch();

  // Debounced draft save
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
        setLastSaved(new Date());
      } catch { /* quota */ }
    }, 1000);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [formValues]);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [shakeBtn, setShakeBtn] = useState(false);

  useEffect(() => {
    if (hadDraft.current) {
      toast({ title: "Draft found — continuing your registration" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    reset(defaultValues);
  };

  /* cascading lists */
  const division = watch("division");
  const district = watch("district");
  const taluk = watch("taluk");
  const urbanRural = watch("urbanRural");
  const gramPanchayathi = watch("gramPanchayathi");

  const districtOptions = division ? districtsByDivision[division] ?? [] : [];
  const talukOptions = district ? taluksByDistrict[district] ?? [] : [];
  const pattanaOptions = taluk ? pattanaPanchayathiByTaluk[taluk] ?? [] : [];
  const gpOptions = taluk ? gramPanchayathiByTaluk[taluk] ?? [] : [];
  const villageOptions = gramPanchayathi ? villagesByGP[gramPanchayathi] ?? [] : [];

  const handleDivision = (v: string) => {
    setValue("division", v); setValue("district", ""); setValue("taluk", "");
    setValue("cmcType", ""); setValue("pattana", ""); setValue("ward", "");
    setValue("gramPanchayathi", ""); setValue("village", "");
  };
  const handleDistrict = (v: string) => {
    setValue("district", v); setValue("taluk", "");
    setValue("cmcType", ""); setValue("pattana", ""); setValue("ward", "");
    setValue("gramPanchayathi", ""); setValue("village", "");
  };
  const handleTaluk = (v: string) => {
    setValue("taluk", v);
    setValue("cmcType", ""); setValue("pattana", ""); setValue("ward", "");
    setValue("gramPanchayathi", ""); setValue("village", "");
  };
  const handleUrbanRural = (v: "Urban" | "Rural") => {
    setValue("urbanRural", v);
    setValue("cmcType", ""); setValue("pattana", ""); setValue("ward", "");
    setValue("gramPanchayathi", ""); setValue("village", "");
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
  const doorNo = watch("doorNo");
  const buildingName = watch("buildingName");
  const crossRoad = watch("crossRoad");
  const mainRoad = watch("mainRoad");
  const landmark = watch("landmark");
  const areaName = watch("areaName");
  const cmcType = watch("cmcType");
  const pattana = watch("pattana");
  const wardVal = watch("ward");
  const villageVal = watch("village");
  const pincode = watch("pincode");

  const generatedAddress = useMemo(() => {
    const parts: string[] = [];
    if (doorNo) parts.push(doorNo);
    if (buildingName) parts.push(buildingName);
    if (crossRoad) parts.push(crossRoad);
    if (mainRoad) parts.push(mainRoad);
    if (landmark) parts.push("near " + landmark);
    if (areaName) parts.push(areaName);
    if (urbanRural === "Urban") {
      if (cmcType) parts.push(cmcType);
      if (pattana) parts.push(pattana);
      if (wardVal) parts.push(wardVal);
    } else if (urbanRural === "Rural") {
      if (gramPanchayathi) parts.push(gramPanchayathi);
      if (villageVal) parts.push(villageVal);
    }
    if (taluk) parts.push(taluk);
    if (district) parts.push(district);
    if (division) parts.push(division);
    parts.push("KARNATAKA");
    if (pincode) parts.push(pincode);
    return parts.join(", ");
  }, [doorNo, buildingName, crossRoad, mainRoad, landmark, areaName, urbanRural, cmcType, pattana, wardVal, gramPanchayathi, villageVal, taluk, district, division, pincode]);

  /* scroll to first error */
  const scrollToFirstError = useCallback((errKeys: string[]) => {
    const firstKey = errKeys[0];
    if (!firstKey || !formRef.current) return;
    const el = formRef.current.querySelector(`[data-field="${firstKey}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  /* submit */
  const onSubmit = async (data: FormValues) => {
    // Additional custom validation for conditional fields
    const customErrors: string[] = [];
    if (!isOrgType) {
      if (!data.aadhaarNo || !/^\d{4}\s?\d{4}\s?\d{4}$/.test(data.aadhaarNo)) customErrors.push("aadhaarNo");
      if (!data.panNo || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(data.panNo)) customErrors.push("panNo");
    }
    if (data.urbanRural === "Urban") {
      if (!data.cmcType) customErrors.push("cmcType");
      if (!data.pattana) customErrors.push("pattana");
      if (!data.ward) customErrors.push("ward");
    }
    if (data.urbanRural === "Rural") {
      if (!data.gramPanchayathi) customErrors.push("gramPanchayathi");
      if (!data.village) customErrors.push("village");
    }

    if (customErrors.length > 0) {
      setShakeBtn(true);
      setTimeout(() => setShakeBtn(false), 400);
      scrollToFirstError(customErrors);
      return;
    }

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
        localStorage.removeItem(STORAGE_KEY);
        toast({ title: `Account already exists. Welcome back, ${existing.client_name}!` });
        navigate("/dashboard", { replace: true });
        return;
      }

      if (isOrgType) {
        const orgBody: Record<string, unknown> = {
          company_name: data.companyName,
          company_type: data.companyType,
          gstin_pan: data.gstinPan,
          business_registration_number: data.businessRegNo,
          nature_of_business: data.natureOfBusiness,
          company_website: data.companyWebsite,
          number_of_employees: data.numEmployees ? Number(data.numEmployees) : undefined,
          annual_revenue_range: data.annualRevenue,
          date_of_establishment: data.dateOfEstablishment || undefined,
          owner_name: data.ownerName,
          ownership_status: data.ownershipStatus,
          incorporation_number: data.incorporationNumber,
          office_address: generatedAddress,
          org_state: "Karnataka",
          org_district: data.district,
          org_taluk: data.taluk,
          org_pincode: data.pincode,
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
          client_name: data.companyName, email: data.email, client_type: "Organisation",
          registration_type: auth.registrationType, organisation_link: orgName,
          client_state: "Karnataka", division: data.division, client_district: data.district,
          client_taluk: data.taluk, urban_rural: data.urbanRural, cmc_tmc_type: data.cmcType,
          pattana_panchayathi: data.pattana, ward: data.ward, post_office: data.postOffice,
          client_pincode: data.pincode, full_address_review: generatedAddress,
          client_latitude: data.latitude, client_longitude: data.longitude,
          phone_no: auth.phone, otp_verified: 1, terms_accepted: 1, client_status: "Active",
        };

        const res = await createRecord("DigiVault Client", clientBody);
        const clientId = res?.data?.name || "CL-00001";
        setAuth((prev) => ({ ...prev, client_id: clientId, name: data.companyName, supabaseUserId: prev.supabaseUserId || "" }));
        localStorage.removeItem(STORAGE_KEY);
        toast({ title: "Registration successful!" });
        navigate("/dashboard", { replace: true });
      } else {
        const body: Record<string, unknown> = {
          client_name: data.fullName, salutation: data.salutation,
          relation_type: data.relationType, relation_name: data.relationName,
          date_of_birth: data.dateOfBirth || undefined,
          age: data.age ? Number(data.age) : undefined,
          email: data.email, phone_no: auth.phone,
          whatsapp_no: data.whatsappNo ? "+91" + data.whatsappNo : undefined,
          aadhaar_no: data.aadhaarNo.replace(/\s/g, ""),
          pan_no: data.panNo.toUpperCase(),
          door_no: data.doorNo, building_name: data.buildingName,
          cross_road: data.crossRoad, main_road: data.mainRoad,
          landmark: data.landmark, area_name: data.areaName,
          client_type: "Personal",
          registration_type: auth.registrationType, client_state: "Karnataka",
          division: data.division, client_district: data.district, client_taluk: data.taluk,
          urban_rural: data.urbanRural, cmc_tmc_type: data.cmcType,
          pattana_panchayathi: data.pattana, ward: data.ward,
          gram_panchayathi: data.gramPanchayathi, village: data.village,
          post_office: data.postOffice,
          client_pincode: data.pincode, full_address_review: generatedAddress,
          client_latitude: data.latitude || undefined,
          client_longitude: data.longitude || undefined,
          bd_referral_code: data.bdReferralCode || undefined,
          otp_verified: 1, terms_accepted: 1, client_status: "Active",
        };
        Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

        const res = await createRecord("DigiVault Client", body);
        const clientId = res?.data?.name || "CL-00001";
        setAuth((prev) => ({ ...prev, client_id: clientId, name: data.fullName, supabaseUserId: prev.supabaseUserId || "" }));
        localStorage.removeItem(STORAGE_KEY);
        toast({ title: "Registration successful!" });
        navigate("/dashboard", { replace: true });
      }
    } catch {
      toast({ title: "Registration failed. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onError = (errs: any) => {
    setShakeBtn(true);
    setTimeout(() => setShakeBtn(false), 400);
    scrollToFirstError(Object.keys(errs));
  };

  /* ── Address section (shared) ── */
  const renderAddress = (heading = "Address") => (
    <section className="space-y-4">
      <h2 className="text-base font-bold text-foreground">{heading}</h2>

      {/* Detailed address fields */}
      {!isOrgType && (
        <>
          <div className="space-y-1" data-field="doorNo">
            <RequiredLabel>Door No</RequiredLabel>
            <Input placeholder="#18" {...register("doorNo", { required: "Door number is required" })} className={`h-12 ${errors.doorNo ? "border-destructive ring-1 ring-destructive" : ""}`} />
            {errors.doorNo && <p className="text-xs text-destructive mt-1">{errors.doorNo.message}</p>}
          </div>
          <div className="space-y-1" data-field="buildingName">
            <RequiredLabel>Building Name</RequiredLabel>
            <Input placeholder="Lakshmi Nivasa" {...register("buildingName", { required: "Building name is required" })} className={`h-12 ${errors.buildingName ? "border-destructive ring-1 ring-destructive" : ""}`} />
            {errors.buildingName && <p className="text-xs text-destructive mt-1">{errors.buildingName.message}</p>}
          </div>
          <div className="space-y-1" data-field="crossRoad">
            <RequiredLabel>Cross Road</RequiredLabel>
            <Input placeholder="2nd Cross" {...register("crossRoad", { required: "Cross road is required" })} className={`h-12 ${errors.crossRoad ? "border-destructive ring-1 ring-destructive" : ""}`} />
            {errors.crossRoad && <p className="text-xs text-destructive mt-1">{errors.crossRoad.message}</p>}
          </div>
          <div className="space-y-1" data-field="mainRoad">
            <RequiredLabel>Main Road</RequiredLabel>
            <Input placeholder="Bannerghatta Main" {...register("mainRoad", { required: "Main road is required" })} className={`h-12 ${errors.mainRoad ? "border-destructive ring-1 ring-destructive" : ""}`} />
            {errors.mainRoad && <p className="text-xs text-destructive mt-1">{errors.mainRoad.message}</p>}
          </div>
          <div className="space-y-1" data-field="landmark">
            <RequiredLabel>Landmark</RequiredLabel>
            <Input placeholder="Near Meenakshi Temple" {...register("landmark", { required: "Landmark is required" })} className={`h-12 ${errors.landmark ? "border-destructive ring-1 ring-destructive" : ""}`} />
            {errors.landmark && <p className="text-xs text-destructive mt-1">{errors.landmark.message}</p>}
          </div>
          <div className="space-y-1" data-field="areaName">
            <RequiredLabel>Area Name</RequiredLabel>
            <Input placeholder="Arekere MICO Layout" {...register("areaName", { required: "Area name is required" })} className={`h-12 ${errors.areaName ? "border-destructive ring-1 ring-destructive" : ""}`} />
            {errors.areaName && <p className="text-xs text-destructive mt-1">{errors.areaName.message}</p>}
          </div>
        </>
      )}

      <Dropdown label="State" value="Karnataka" onChange={() => {}} options={["Karnataka"]} disabled />
      <div data-field="division">
        <Dropdown label="Division" value={division} onChange={handleDivision} options={divisions} required error={errors.division?.message} />
      </div>
      <div data-field="district">
        <Dropdown label="District" value={district} onChange={handleDistrict} options={districtOptions} placeholder={division ? "Select District" : "Select Division first"} required error={errors.district?.message} />
      </div>
      <div data-field="taluk">
        <Dropdown label="Taluk" value={taluk} onChange={handleTaluk} options={talukOptions} placeholder={district ? "Select Taluk" : "Select District first"} required error={errors.taluk?.message} />
      </div>

      <div className="space-y-2" data-field="urbanRural">
        <RequiredLabel>Select Urban / Rural</RequiredLabel>
        <div className="flex gap-6">
          {(["Urban", "Rural"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleUrbanRural(opt)}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${urbanRural === opt ? "border-primary" : "border-input"}`}>
                {urbanRural === opt && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </span>
              <span className="text-sm text-foreground">{opt}</span>
            </button>
          ))}
        </div>
        {errors.urbanRural && <p className="text-xs text-destructive mt-1">{errors.urbanRural.message}</p>}
      </div>

      {urbanRural === "Urban" && (
        <div className="space-y-4">
          <div data-field="cmcType">
            <Dropdown label="Select CMC/TMC/TP/GBA/MC" value={cmcType} onChange={(v) => setValue("cmcType", v)} options={cmcTmcOptions} required />
          </div>
          <div data-field="pattana">
            <Dropdown label="Select Pattana Panchayathi" value={pattana} onChange={(v) => setValue("pattana", v)} options={pattanaOptions} placeholder={taluk ? "Select Pattana Panchayathi" : "Select Taluk first"} required />
          </div>
          <Dropdown label="Urban Ward" value={wardVal} onChange={(v) => setValue("ward", v)} options={urbanWards} placeholder="Select Ward" required />
        </div>
      )}

      {urbanRural === "Rural" && (
        <div className="space-y-4">
          <div data-field="gramPanchayathi">
            <Dropdown label="Select Gram Panchayathi" value={gramPanchayathi} onChange={(v) => setValue("gramPanchayathi", v)} options={gpOptions} placeholder={taluk ? "Select Gram Panchayathi" : "Select Taluk first"} required />
          </div>
          <Dropdown label="Village" value={villageVal} onChange={(v) => setValue("village", v)} options={villageOptions} placeholder={gramPanchayathi ? "Select Village" : "Select GP first"} required />
        </div>
      )}

      <div className="space-y-1" data-field="postOffice">
        <RequiredLabel>Post Office</RequiredLabel>
        <Input placeholder="Ilanthila" {...register("postOffice", { required: "Post office is required" })} className="h-12" />
        {errors.postOffice && <p className="text-xs text-destructive mt-1">{errors.postOffice.message}</p>}
      </div>

      <div className="space-y-1" data-field="pincode">
        <RequiredLabel>Pincode</RequiredLabel>
        <Input
          type="number"
          placeholder="560016"
          {...register("pincode", { required: "Enter a valid 6-digit pincode", pattern: { value: /^\d{6}$/, message: "Enter a valid 6-digit pincode" } })}
          maxLength={6}
          className={`h-12 ${errors.pincode ? "border-destructive ring-1 ring-destructive" : ""}`}
        />
        {errors.pincode && <p className="text-xs text-destructive mt-1">{errors.pincode.message}</p>}
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
          <Input placeholder="12.9716" {...register("latitude")} className="h-12" />
        </div>
        <div className="space-y-1">
          <RequiredLabel>Longitude</RequiredLabel>
          <Input placeholder="77.5946" {...register("longitude")} className="h-12" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowMap(true)}
        className="flex items-center gap-2 text-sm text-primary min-h-[44px]"
      >
        <MapPin size={18} className="text-destructive" />
        {watch("latitude") && watch("longitude")
          ? `📍 ${Number(watch("latitude")).toFixed(4)}°N, ${Number(watch("longitude")).toFixed(4)}°E`
          : "Select the location"}
      </button>

      {/* BD Referral Code */}
      <div className="space-y-1" data-field="bdReferralCode">
        <RequiredLabel>BD Referral Code</RequiredLabel>
        <div className="flex gap-2">
          <Input
            placeholder="Type / Scan"
            {...register("bdReferralCode", { required: "BD Referral Code is required" })}
            className="h-12 flex-1"
          />
          <button type="button" className="h-12 w-12 rounded-lg border border-input bg-background flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
          </button>
        </div>
        {errors.bdReferralCode && <p className="text-xs text-destructive mt-1">{errors.bdReferralCode.message}</p>}
      </div>
    </section>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* header */}
      <div className="sticky top-0 z-10 flex items-center bg-background border-b border-border px-4 h-14">
        <button type="button" onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-11">Registration</h1>
      </div>

      {/* scrollable form */}
      <form
        ref={formRef as any}
        className="flex-1 overflow-y-auto px-5 py-6 pb-28 space-y-6"
        onSubmit={handleSubmit(onSubmit, onError)}
      >
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
                  {...register("companyName", { required: "Company name is required", minLength: { value: 2, message: "Min 2 characters" } })}
                  className={`h-12 ${errors.companyName ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName.message}</p>}
              </div>

              <Controller
                control={control}
                name="companyType"
                rules={{ required: "Company type is required" }}
                render={({ field }) => (
                  <Dropdown label="Company Type" value={field.value} onChange={field.onChange} options={companyTypes} placeholder="Select Company Type" error={errors.companyType?.message} required />
                )}
              />

              <div className="space-y-1" data-field="gstinPan">
                <RequiredLabel>GSTIN / PAN</RequiredLabel>
                <Controller
                  control={control}
                  name="gstinPan"
                  rules={{ required: "GSTIN must be 15 alphanumeric characters", pattern: { value: /^[A-Z0-9]{15}$/i, message: "GSTIN must be 15 alphanumeric characters" } }}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase().slice(0, 15))}
                      className={`h-12 ${errors.gstinPan ? "border-destructive ring-1 ring-destructive" : ""}`}
                    />
                  )}
                />
                {errors.gstinPan && <p className="text-xs text-destructive mt-1">{errors.gstinPan.message}</p>}
              </div>

              <div className="space-y-1" data-field="businessRegNo">
                <RequiredLabel>Business Registration Number</RequiredLabel>
                <Input placeholder="Enter registration number" {...register("businessRegNo", { required: "Business registration number is required" })} className="h-12" />
                {errors.businessRegNo && <p className="text-xs text-destructive mt-1">{errors.businessRegNo.message}</p>}
              </div>

              <div className="space-y-1" data-field="natureOfBusiness">
                <RequiredLabel>Nature of Business</RequiredLabel>
                <Input placeholder="e.g. Real Estate, Agriculture" {...register("natureOfBusiness", { required: "Nature of business is required" })} className="h-12" />
                {errors.natureOfBusiness && <p className="text-xs text-destructive mt-1">{errors.natureOfBusiness.message}</p>}
              </div>

              <div className="space-y-1" data-field="companyWebsite">
                <RequiredLabel>Company Website</RequiredLabel>
                <Input placeholder="https://example.com" {...register("companyWebsite", { required: "Company website is required" })} className="h-12" />
                {errors.companyWebsite && <p className="text-xs text-destructive mt-1">{errors.companyWebsite.message}</p>}
              </div>

              <div className="space-y-1" data-field="numEmployees">
                <RequiredLabel>Number of Employees</RequiredLabel>
                <Input type="number" placeholder="e.g. 50" {...register("numEmployees", { required: "Number of employees is required" })} className="h-12" />
                {errors.numEmployees && <p className="text-xs text-destructive mt-1">{errors.numEmployees.message}</p>}
              </div>

              <Controller
                control={control}
                name="annualRevenue"
                rules={{ required: "Annual revenue range is required" }}
                render={({ field }) => (
                  <Dropdown label="Annual Revenue Range" value={field.value} onChange={field.onChange} options={revenueRanges} placeholder="Select Range" error={errors.annualRevenue?.message} required />
                )}
              />

              <div className="space-y-1" data-field="dateOfEstablishment">
                <RequiredLabel>Date of Establishment</RequiredLabel>
                <Input type="date" {...register("dateOfEstablishment", { required: "Date of establishment is required" })} className="h-12" />
                {errors.dateOfEstablishment && <p className="text-xs text-destructive mt-1">{errors.dateOfEstablishment.message}</p>}
              </div>

              <div className="space-y-1" data-field="ownerName">
                <RequiredLabel>Owner Name</RequiredLabel>
                <Input placeholder="Enter owner name" {...register("ownerName", { required: "Owner name is required" })} className="h-12" />
                {errors.ownerName && <p className="text-xs text-destructive mt-1">{errors.ownerName.message}</p>}
              </div>

              <div className="space-y-1" data-field="ownershipStatus">
                <RequiredLabel>Ownership Status</RequiredLabel>
                <Input placeholder="e.g. Sole Proprietor, Partner" {...register("ownershipStatus", { required: "Ownership status is required" })} className="h-12" />
                {errors.ownershipStatus && <p className="text-xs text-destructive mt-1">{errors.ownershipStatus.message}</p>}
              </div>

              <div className="space-y-1" data-field="incorporationNumber">
                <RequiredLabel>Incorporation Number</RequiredLabel>
                <Input placeholder="Optional" {...register("incorporationNumber", { required: "Incorporation number is required" })} className="h-12" />
                {errors.incorporationNumber && <p className="text-xs text-destructive mt-1">{errors.incorporationNumber.message}</p>}
              </div>

              <div className="space-y-1" data-field="email">
                <RequiredLabel>Email</RequiredLabel>
                <Input
                  type="email"
                  placeholder="Enter company email"
                  {...register("email", { required: "Enter a valid email", pattern: { value: PATTERNS.email, message: "Enter a valid email" } })}
                  className={`h-12 ${errors.email ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
            </section>

            <div className="border-t border-border" />
            {renderAddress("Office Address")}
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
                    {...register("salutation")}
                    className="w-[80px] h-12 appearance-none rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {["Mr", "Mrs", "Ms", "Dr"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Input
                    placeholder="Rajesh Kumar"
                    {...register("fullName", { required: "Full name is required", minLength: { value: 2, message: "Min 2 characters" } })}
                    className={`h-12 flex-1 ${errors.fullName ? "border-destructive ring-1 ring-destructive" : ""}`}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
              </div>

              {/* Relation Name: S/O + Name side by side */}
              <div className="space-y-1" data-field="relationName">
                <RequiredLabel>Relation Name</RequiredLabel>
                <div className="flex gap-2">
                  <select
                    {...register("relationType")}
                    className="w-[80px] h-12 appearance-none rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {["S/O", "D/O", "W/O", "C/O"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <Input
                    placeholder="Kumar Rao"
                    {...register("relationName", { required: "Relation name is required" })}
                    className={`h-12 flex-1 ${errors.relationName ? "border-destructive ring-1 ring-destructive" : ""}`}
                  />
                </div>
                {errors.relationName && <p className="text-xs text-destructive mt-1">{errors.relationName.message}</p>}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1" data-field="dateOfBirth">
                <RequiredLabel>Date of Birth</RequiredLabel>
                <Controller
                  control={control}
                  name="dateOfBirth"
                  rules={{ required: "Date of birth is required" }}
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value) {
                          const dob = new Date(e.target.value);
                          const today = new Date();
                          let a = today.getFullYear() - dob.getFullYear();
                          const m = today.getMonth() - dob.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
                          setValue("age", String(Math.max(0, a)));
                        }
                      }}
                      className={`h-12 ${errors.dateOfBirth ? "border-destructive ring-1 ring-destructive" : ""}`}
                    />
                  )}
                />
                {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth.message}</p>}
              </div>

              {/* Age (auto-calculated, editable) */}
              <div className="space-y-1" data-field="age">
                <RequiredLabel>Age</RequiredLabel>
                <Input
                  type="number"
                  placeholder="24"
                  {...register("age", { required: "Age is required" })}
                  className="h-12 w-24"
                />
                {errors.age && <p className="text-xs text-destructive mt-1">{errors.age.message}</p>}
              </div>

              {/* Profile Photo */}
              <div className="space-y-1">
                <RequiredLabel>Profile Photo</RequiredLabel>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <button
                  type="button"
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
                  {...register("email", { required: "Enter a valid email", pattern: { value: PATTERNS.email, message: "Enter a valid email" } })}
                  className={`h-12 ${errors.email ? "border-destructive ring-1 ring-destructive" : ""}`}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
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
              <div className="space-y-1" data-field="whatsappNo">
                <RequiredLabel>WhatsApp No</RequiredLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
                  <Controller
                    control={control}
                    name="whatsappNo"
                    rules={{ required: "WhatsApp number is required" }}
                    render={({ field }) => (
                      <Input
                        placeholder="9400 8138 02"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="h-12 pl-12"
                      />
                    )}
                  />
                </div>
                {errors.whatsappNo && <p className="text-xs text-destructive mt-1">{errors.whatsappNo.message}</p>}
                <button
                  type="button"
                  onClick={() => setValue("whatsappNo", auth.phone?.replace("+91", "") || "")}
                  className="text-xs text-primary mt-0.5"
                >
                  Same as Phone No
                </button>
              </div>

              {/* Aadhaar No */}
              <div className="space-y-1" data-field="aadhaarNo">
                <RequiredLabel>Aadhaar No</RequiredLabel>
                <Controller
                  control={control}
                  name="aadhaarNo"
                  rules={{ required: "Enter valid 12-digit Aadhaar", pattern: { value: /^\d{4}\s?\d{4}\s?\d{4}$/, message: "Enter valid 12-digit Aadhaar" } }}
                  render={({ field }) => (
                    <Input
                      placeholder="9446 8334 9230"
                      value={field.value}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                        const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                        field.onChange(formatted);
                      }}
                      className={`h-12 ${errors.aadhaarNo ? "border-destructive ring-1 ring-destructive" : ""}`}
                    />
                  )}
                />
                {errors.aadhaarNo && <p className="text-xs text-destructive mt-1">{errors.aadhaarNo.message}</p>}
              </div>

              {/* PAN No */}
              <div className="space-y-1" data-field="panNo">
                <RequiredLabel>PAN No</RequiredLabel>
                <Controller
                  control={control}
                  name="panNo"
                  rules={{ required: "Enter valid PAN (e.g. ABCDE1234F)", pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, message: "Enter valid PAN (e.g. ABCDE1234F)" } }}
                  render={({ field }) => (
                    <Input
                      placeholder="OHAP55725P"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase().slice(0, 10))}
                      className={`h-12 ${errors.panNo ? "border-destructive ring-1 ring-destructive" : ""}`}
                    />
                  )}
                />
                {errors.panNo && <p className="text-xs text-destructive mt-1">{errors.panNo.message}</p>}
              </div>
            </section>

            {renderAddress()}
          </>
        )}
      </form>

      {/* fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-5 py-4">
        <Button
          type="button"
          className={`w-full h-12 ${shakeBtn ? "animate-[shake_0.3s]" : ""}`}
          onClick={handleSubmit(onSubmit, onError)}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save & Next"}
        </Button>
      </div>
      <LocationPicker
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onSelect={(lat, lng) => {
          setValue("latitude", String(lat.toFixed(6)));
          setValue("longitude", String(lng.toFixed(6)));
          setShowMap(false);
        }}
        initialLat={watch("latitude") ? Number(watch("latitude")) : undefined}
        initialLng={watch("longitude") ? Number(watch("longitude")) : undefined}
      />
    </div>
  );
};

export default RegisterForm;
