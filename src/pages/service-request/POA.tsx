import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOne, updateRecord, getFileUrl } from "@/lib/api";
import { srTransition } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";

const COMPANY_NAME = "Chilume Legal & Liaisoning Pvt. Ltd.";
const COMPANY_REG = "U74999KA2024PTC190862";
const COMPANY_ADDRESS = "#1234, 1st Floor, 80 Feet Road, Koramangala, Bengaluru - 560034, Karnataka";
const COMPANY_PHONE = "+91 9353894389";

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface ClientData {
  client_name: string;
  salutation: string;
  relation_type: string;
  relation_name: string;
  age: number;
  date_of_birth: string;
  aadhaar_no: string;
  pan_no: string;
  full_address_review: string;
  client_district: string;
  phone_no: string;
  client_photo: string;
}

function calcAge(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const POA = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<ClientData | null>(null);
  const [dpName, setDpName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const today = new Date();
  const day = today.getDate();
  const month = months[today.getMonth()];
  const year = today.getFullYear();

  useEffect(() => {
    if (!auth.client_id) return;
    Promise.all([
      fetchOne("DigiVault Client", auth.client_id),
      srId ? fetchOne("DigiVault Service Request", srId) : Promise.resolve(null),
    ]).then(([cl, sr]) => {
      setClient(cl);
      if (cl?.client_photo) {
        setPhotoPreview(getFileUrl(cl.client_photo));
      }
      if (sr?.assigned_dp) {
        fetchOne("DigiVault User", sr.assigned_dp).then((dp) => setDpName(dp?.full_name || "")).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [auth.client_id, srId]);

  const c = client || {} as ClientData;
  const salutation = c.salutation === "Mr" ? "Mr." : c.salutation === "Mrs" ? "Mrs." : c.salutation === "Ms" ? "Ms." : "Mr./Ms.";
  const age = calcAge(c.date_of_birth) || c.age || 0;
  const relationLabel = c.relation_type || "S/O";
  const city = c.client_district || "Bengaluru";

  // Signature canvas handlers
  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) setSignatureData(canvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const handleSubmit = async () => {
    if (!agreed) return;
    if (!signatureData) { toast({ title: "Please sign the letter", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await Promise.allSettled([
        updateRecord("DigiVault Client", auth.client_id, { poa_consent: 1 }),
        updateRecord("DigiVault Service Request", srId!, { poa_signed: 1 }),
      ]);
      toast({ title: "Authorization letter signed!" });
      await srTransition("poa_signed", srId!).catch(() => {});
      setShowPreview(true);
    } catch {
      setShowPreview(true);
    } finally {
      setSaving(false);
    }
  };

  const Filled = ({ children }: { children: React.ReactNode }) => (
    <span className="font-bold text-primary underline decoration-primary/30 underline-offset-2">{children}</span>
  );

  // Preview mode — shows the final letter with signature and photo
  if (showPreview) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex items-center px-4 h-14 border-b border-border">
          <button onClick={() => setShowPreview(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-11">Preview Letter</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 pb-28">
          <div className="border border-border rounded-xl p-5 bg-white space-y-4">
            <h2 className="text-center font-bold text-foreground text-base uppercase tracking-wide">AUTHORIZATION LETTER</h2>

            <p className="text-xs text-foreground leading-[1.8]">
              This Authorization Letter is executed on this <strong>{day}</strong> day of <strong>{month}</strong>, 20<strong>{String(year).slice(2)}</strong>, at <strong>{city}</strong>.
            </p>

            {/* Photo */}
            {photoPreview && (
              <div className="flex justify-center">
                <img src={photoPreview} alt="Client" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
              </div>
            )}

            <p className="text-xs text-foreground leading-[1.8]">
              I, <strong>{salutation} {c.client_name}</strong>, aged <strong>{age}</strong> years, {relationLabel} <strong>{c.relation_name}</strong>,
            </p>

            <p className="text-xs text-foreground leading-[1.8]">
              residing at <strong>{c.full_address_review}</strong>, holding Aadhaar No. <strong>{c.aadhaar_no}</strong> and PAN No. <strong>{c.pan_no}</strong>,
            </p>

            <p className="text-[10px] text-muted-foreground italic">hereinafter referred to as the "Authorizer".</p>

            <p className="text-xs text-foreground">I hereby authorize:</p>

            <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
              <p><strong>{COMPANY_NAME}</strong></p>
              <p>Reg: {COMPANY_REG}</p>
              <p>{COMPANY_ADDRESS}</p>
              <p>Contact: {COMPANY_PHONE}</p>
              {dpName && <p>Representative: <strong>{dpName}</strong></p>}
            </div>

            <ol className="text-[10px] text-foreground leading-[1.7] space-y-1 pl-4 list-decimal">
              <li>Submit, collect, sign and process documents related to government departments.</li>
              <li>Handle personal, legal, commercial, banking and administrative documentation.</li>
              <li>Carry out activities related to land and property documentation including RTC, Mutation, Khata, Tax Payment, EC, Survey, Maps.</li>
              <li>Attend hearings, enquiries or meetings with government/public/private offices.</li>
              <li>Process work with banks, financial institutions or agencies as permitted under law.</li>
            </ol>

            <p className="text-[10px] text-foreground">This authorization remains valid until withdrawn or cancelled by me in writing.</p>

            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-[9px] font-bold text-red-700">NOTE: This authorization is limited to revenue documentation only and shall not be used for sale, transfer, mortgage or disposal of any property.</p>
            </div>

            {/* Signature */}
            <div className="pt-4 space-y-2">
              {signatureData && (
                <div className="flex justify-start">
                  <img src={signatureData} alt="Signature" className="h-16 border-b border-foreground" />
                </div>
              )}
              <p className="text-xs text-foreground">Signature of Authorizer</p>
              <p className="text-xs text-muted-foreground">({c.client_name})</p>
              <p className="text-[10px] text-muted-foreground">Date: {day}/{today.getMonth()+1}/{year}</p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4">
          <Button className="w-full h-12" onClick={() => navigate(`/service-request/${encodeURIComponent(srId!)}/esign`, { replace: true })}>
            Continue to E-Sign
          </Button>
        </div>
      </div>
    );
  }

  // Main letter view
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-11">Authorization Letter</h1>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Loading your details...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-40 space-y-4">
          <h2 className="text-center font-bold text-foreground text-base uppercase tracking-wide">AUTHORIZATION LETTER</h2>

          <p className="text-sm text-foreground leading-[1.8]">
            This Authorization Letter is executed on this <Filled>{day}</Filled> day of <Filled>{month}</Filled>, 20<Filled>{String(year).slice(2)}</Filled>, at <Filled>{city}</Filled>.
          </p>

          <p className="text-sm text-foreground leading-[1.8]">
            I, <Filled>{salutation} {c.client_name || "___"}</Filled>, aged <Filled>{age || "___"}</Filled> years, {relationLabel} <Filled>{c.relation_name || "___"}</Filled>,
          </p>

          <p className="text-sm text-foreground leading-[1.8]">
            residing at <Filled>{c.full_address_review || "___"}</Filled>, holding Aadhaar No. <Filled>{c.aadhaar_no || "___"}</Filled> and PAN No. <Filled>{c.pan_no || "___"}</Filled>,
          </p>

          <p className="text-sm text-muted-foreground italic">hereinafter referred to as the "Authorizer".</p>

          <p className="text-sm text-foreground leading-[1.8]">I hereby authorize the organization named:</p>

          <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Organization Name:</span> <Filled>{COMPANY_NAME}</Filled></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Registration No.:</span> <Filled>{COMPANY_REG}</Filled></div>
            <div className="text-sm"><span className="text-muted-foreground">Address: </span><Filled>{COMPANY_ADDRESS}</Filled></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Contact No.:</span> <Filled>{COMPANY_PHONE}</Filled></div>
            {dpName && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Authorized Representative:</span> <Filled>{dpName}</Filled></div>}
          </div>

          <p className="text-sm text-muted-foreground italic">Hereinafter referred to as the "Authorized Organization."</p>

          <p className="text-sm text-foreground leading-[1.8]">I hereby grant the Authorized Organization the permission to act on my behalf for the following purposes:</p>

          <ol className="text-sm text-foreground leading-[1.8] space-y-2 pl-5 list-decimal">
            <li>Submit, collect, sign and process documents related to government departments including Revenue Department, Tahsildar Office, Sub-Registrar Office, BBMP/Panchayat, Survey Department and related authorities.</li>
            <li>Handle personal, legal, commercial, banking and administrative documentation such as applications, affidavits, agreements, forms and declarations.</li>
            <li>Carry out activities related to land and property documentation including RTC, Mutation, Khata, Tax Payment, EC, Survey, Maps and Record Updates.</li>
            <li>Attend hearings, enquiries or meetings with government/public/private offices and communicate updates to concerned authorities.</li>
            <li>Process work with banks, financial institutions or agencies as permitted under law (excluding personal testimony or activities prohibited by law).</li>
          </ol>

          <p className="text-sm text-foreground leading-[1.8]">This authorization remains valid until withdrawn or cancelled by me in writing.</p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs font-bold text-red-700">NOTE: This authorization is limited to revenue documentation only and shall not be used for sale, transfer, mortgage or disposal of any property.</p>
          </div>

          {/* Signature Pad */}
          <div className="space-y-2 pt-4">
            <p className="text-sm font-bold text-foreground">Your Signature <span className="text-destructive">*</span></p>
            <div className="relative border-2 border-dashed border-border rounded-xl overflow-hidden bg-white" style={{ touchAction: "none" }}>
              <canvas
                ref={canvasRef}
                width={340}
                height={140}
                className="w-full"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {!signatureData && (
                <p className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none">
                  Sign here
                </p>
              )}
            </div>
            {signatureData && (
              <button onClick={clearSignature} className="text-xs text-destructive underline">Clear signature</button>
            )}
          </div>

          {/* Consent */}
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex items-start gap-3">
              <Checkbox id="poa-consent" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
              <label htmlFor="poa-consent" className="text-xs text-muted-foreground leading-relaxed">
                I, <span className="font-semibold text-foreground">{c.client_name || "___"}</span>, hereby authorize Chilume Legal & Liaisoning Pvt. Ltd. (e-DigiVault) to act as my representative and Process Owner Authority for the purpose of handling and processing my service request.
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Bottom buttons */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 flex gap-3 justify-center">
          <Button variant="outline" className="flex-1 h-12 border-primary text-primary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button className="flex-1 h-12" disabled={!agreed || !signatureData || saving} onClick={handleSubmit}>
            {saving ? "Signing..." : "Sign & Preview"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default POA;
