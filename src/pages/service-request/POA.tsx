import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
  client_name: string; salutation: string; relation_type: string; relation_name: string;
  age: number; date_of_birth: string; aadhaar_no: string; pan_no: string;
  full_address_review: string; client_district: string; phone_no: string; client_photo: string;
}

function calcAge(dob: string): number {
  if (!dob) return 0;
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
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
  const [signed, setSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const today = new Date();
  const day = today.getDate(), month = months[today.getMonth()], year = today.getFullYear();

  useEffect(() => {
    if (!auth.client_id) return;
    Promise.all([
      fetchOne("DigiVault Client", auth.client_id),
      srId ? fetchOne("DigiVault Service Request", srId) : Promise.resolve(null),
    ]).then(([cl, sr]) => {
      setClient(cl);
      if (cl?.client_photo) setPhotoUrl(getFileUrl(cl.client_photo));
      if (sr?.assigned_dp) fetchOne("DigiVault User", sr.assigned_dp).then((dp) => setDpName(dp?.full_name || "")).catch(() => {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, [auth.client_id, srId]);

  const c = client || {} as ClientData;
  const sal = c.salutation === "Mr" ? "Mr." : c.salutation === "Mrs" ? "Mrs." : c.salutation === "Ms" ? "Ms." : "Mr./Ms.";
  const age = calcAge(c.date_of_birth) || c.age || 0;
  const rel = c.relation_type || "S/O";
  const city = c.client_district || "Bengaluru";

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    setIsDrawing(true);
    const r = cv.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - r.left : (e as React.MouseEvent).clientX - r.left;
    const y = ("touches" in e) ? e.touches[0].clientY - r.top : (e as React.MouseEvent).clientY - r.top;
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const r = cv.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - r.left : (e as React.MouseEvent).clientX - r.left;
    const y = ("touches" in e) ? e.touches[0].clientY - r.top : (e as React.MouseEvent).clientY - r.top;
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#1a1a2e";
    ctx.lineTo(x, y); ctx.stroke();
  };
  const endDraw = () => { setIsDrawing(false); if (canvasRef.current) setSignatureData(canvasRef.current.toDataURL("image/png")); };
  const clearSig = () => {
    const cv = canvasRef.current; if (!cv) return;
    cv.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
    setSignatureData(null); setSigned(false);
  };

  const handleSubmit = async () => {
    if (!agreed || !signatureData) { toast({ title: "Please sign and agree", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await Promise.allSettled([
        updateRecord("DigiVault Client", auth.client_id, { poa_consent: 1 }),
        updateRecord("DigiVault Service Request", srId!, { poa_signed: 1 }),
      ]);
      await srTransition("poa_signed", srId!).catch(() => {});
      setSigned(true);
      toast({ title: "Authorization letter signed!" });
    } catch { setSigned(true); } finally { setSaving(false); }
  };

  const F = ({ children }: { children: React.ReactNode }) => (
    <span className="font-bold text-primary underline decoration-primary/30 underline-offset-2">{children}</span>
  );

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-11">Authorization Letter</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-36 space-y-4">
        <h2 className="text-center font-bold text-foreground text-base uppercase tracking-wide">AUTHORIZATION LETTER</h2>

        <p className="text-sm text-foreground leading-[1.8]">
          This Authorization Letter is executed on this <F>{day}</F> day of <F>{month}</F>, 20<F>{String(year).slice(2)}</F>, at <F>{city}</F>.
        </p>

        {/* Photo — shown inline */}
        {photoUrl && (
          <div className="flex justify-center">
            <img src={photoUrl} alt="Client" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
          </div>
        )}

        <p className="text-sm text-foreground leading-[1.8]">
          I, <F>{sal} {c.client_name || "___"}</F>, aged <F>{age || "___"}</F> years, {rel} <F>{c.relation_name || "___"}</F>,
        </p>

        <p className="text-sm text-foreground leading-[1.8]">
          residing at <F>{c.full_address_review || "___"}</F>, holding Aadhaar No. <F>{c.aadhaar_no || "___"}</F> and PAN No. <F>{c.pan_no || "___"}</F>,
        </p>

        <p className="text-sm text-muted-foreground italic">hereinafter referred to as the "Authorizer".</p>

        <p className="text-sm text-foreground leading-[1.8]">I hereby authorize the organization named:</p>

        <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Organization:</span> <F>{COMPANY_NAME}</F></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reg No.:</span> <F>{COMPANY_REG}</F></div>
          <div className="text-sm"><span className="text-muted-foreground">Address: </span><F>{COMPANY_ADDRESS}</F></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Contact:</span> <F>{COMPANY_PHONE}</F></div>
          {dpName && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Representative:</span> <F>{dpName}</F></div>}
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

        {/* Signature section */}
        <div className="space-y-2 pt-2">
          <p className="text-sm font-bold text-foreground">Your Signature <span className="text-destructive">*</span></p>
          {!signed ? (
            <>
              <div className="relative border-2 border-dashed border-border rounded-xl overflow-hidden bg-white" style={{ touchAction: "none" }}>
                <canvas ref={canvasRef} width={340} height={120} className="w-full"
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
                {!signatureData && <p className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none">Sign here</p>}
              </div>
              {signatureData && <button onClick={clearSig} className="text-xs text-destructive underline">Clear signature</button>}
            </>
          ) : (
            /* After signing — show the captured signature image */
            <div className="border border-green-300 rounded-xl p-3 bg-green-50/50">
              {signatureData && <img src={signatureData} alt="Your signature" className="h-14" />}
              <p className="text-xs text-green-700 mt-1 font-semibold">Signed successfully</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">({c.client_name || "Name"})</p>
          <p className="text-[10px] text-muted-foreground">Date: {day}/{today.getMonth()+1}/{year}</p>
        </div>

        {/* Consent — only before signing */}
        {!signed && (
          <div className="border-t border-border pt-4">
            <div className="flex items-start gap-3">
              <Checkbox id="poa-consent" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
              <label htmlFor="poa-consent" className="text-xs text-muted-foreground leading-relaxed">
                I, <span className="font-semibold text-foreground">{c.client_name || "___"}</span>, hereby authorize Chilume Legal & Liaisoning Pvt. Ltd. (e-DigiVault) to act as my representative and Process Owner Authority for the purpose of handling and processing my service request.
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4">
        {!signed ? (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 border-primary text-primary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button className="flex-1 h-12" disabled={!agreed || !signatureData || saving} onClick={handleSubmit}>
              {saving ? "Signing..." : "Sign & Submit"}
            </Button>
          </div>
        ) : (
          <Button className="w-full h-12" onClick={() => navigate(`/service-request/${encodeURIComponent(srId!)}/esign`, { replace: true })}>
            Continue to E-Sign
          </Button>
        )}
      </div>
    </div>
  );
};

export default POA;
