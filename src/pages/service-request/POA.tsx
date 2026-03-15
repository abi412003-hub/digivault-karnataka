import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOne, updateRecord } from "@/lib/api";
import { srTransition } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";

const COMPANY_NAME = "Chilume Legal & Liaisoning Pvt. Ltd.";
const COMPANY_REG = "U74999KA2024PTC190862";
const COMPANY_ADDRESS = "#1234, 1st Floor, 80 Feet Road, Koramangala, Bengaluru - 560034, Karnataka";
const COMPANY_PHONE = "+91 9353894389";

interface ClientData {
  client_name: string;
  salutation: string;
  relation_type: string;
  relation_name: string;
  age: number;
  aadhaar_no: string;
  pan_no: string;
  full_address_review: string;
  client_district: string;
  phone_no: string;
}

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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
      if (sr?.assigned_dp) {
        fetchOne("DigiVault User", sr.assigned_dp).then((dp) => setDpName(dp?.full_name || "")).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [auth.client_id, srId]);

  const c = client || {} as ClientData;
  const salutation = c.salutation === "Mr" ? "Mr." : c.salutation === "Mrs" ? "Mrs." : c.salutation === "Ms" ? "Ms." : "Mr./Ms.";
  const kanSalutation = c.salutation === "Mr" ? "ಶ್ರೀ" : c.salutation === "Mrs" ? "ಶ್ರೀಮತಿ" : "ಶ್ರೀ/ಶ್ರೀಮತಿ";
  const relationLabel = c.relation_type || "S/O";
  const kanRelation = c.relation_type === "S/O" ? "ತಂದೆ" : c.relation_type === "D/O" ? "ತಂದೆ" : c.relation_type === "W/O" ? "ಪತಿ" : "ತಂದೆ/ತಾಯಿ/ಪತಿ";
  const city = c.client_district || "Bengaluru";

  const handleSubmit = async () => {
    if (!agreed) return;
    setSaving(true);
    try {
      await Promise.allSettled([
        updateRecord("DigiVault Client", auth.client_id, { poa_consent: 1 }),
        updateRecord("DigiVault Service Request", srId!, { poa_signed: 1 }),
      ]);
      toast({ title: "Authorization letter signed!" });
      await srTransition("poa_signed", srId!).catch(() => {});
      navigate(`/service-request/${encodeURIComponent(srId!)}/esign`, { replace: true });
    } catch {
      navigate(`/service-request/${encodeURIComponent(srId!)}/esign`, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const Filled = ({ children }: { children: React.ReactNode }) => (
    <span className="font-bold text-primary underline decoration-primary/30 underline-offset-2">{children}</span>
  );

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
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-36 space-y-4">
          {/* English Version */}
          <h2 className="text-center font-bold text-foreground text-base uppercase tracking-wide">AUTHORIZATION LETTER</h2>

          <p className="text-sm text-foreground leading-[1.8]">
            This Authorization Letter is executed on this <Filled>{day}</Filled> day of <Filled>{month}</Filled>, 20<Filled>{String(year).slice(2)}</Filled>, at <Filled>{city}</Filled>.
          </p>

          <p className="text-sm text-foreground leading-[1.8]">
            I, <Filled>{salutation} {c.client_name || "___"}</Filled>, aged <Filled>{c.age || "___"}</Filled> years, {relationLabel} <Filled>{c.relation_name || "___"}</Filled>,
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

          <p className="text-sm text-foreground leading-[1.8]">All actions performed by the Authorized Organization under this letter shall be considered legally valid and binding on me.</p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs font-bold text-red-700">NOTE: This authorization is limited to revenue documentation only and shall not be used for sale, transfer, mortgage or disposal of any property.</p>
          </div>

          <div className="pt-4">
            <p className="text-sm text-foreground">Signature: ________________</p>
            <p className="text-sm text-muted-foreground mt-1">(<Filled>{c.client_name || "Name"}</Filled>)</p>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-primary/20 my-6" />

          {/* Kannada Version */}
          <h2 className="text-center font-bold text-foreground text-base">ಪ್ರಾಧಿಕಾರ ಪತ್ರ (AUTHORIZATION LETTER)</h2>

          <p className="text-sm text-foreground leading-[1.8]">
            ಇದು ಇಂದು <Filled>{day}</Filled> ದಿನ <Filled>{month}</Filled> 20<Filled>{String(year).slice(2)}</Filled> ರಂದು <Filled>{city}</Filled> ಇಲ್ಲಿ ಮಾಡಲ್ಪಟ್ಟಿದೆ.
          </p>

          <p className="text-sm text-foreground leading-[1.8]">
            ನಾನು {kanSalutation} <Filled>{c.client_name || "___"}</Filled>, ವಯಸ್ಸು <Filled>{c.age || "___"}</Filled> ವರ್ಷ, {kanRelation}: <Filled>{c.relation_name || "___"}</Filled>,
          </p>

          <p className="text-sm text-foreground leading-[1.8]">
            ವಾಸ: <Filled>{c.full_address_review || "___"}</Filled>,
          </p>

          <p className="text-sm text-foreground leading-[1.8]">
            ಆಧಾರ್ ಸಂಖ್ಯೆ: <Filled>{c.aadhaar_no || "___"}</Filled>, PAN ಸಂಖ್ಯೆ: <Filled>{c.pan_no || "___"}</Filled>,
          </p>

          <p className="text-sm text-muted-foreground italic">ಇದರಿಂದ ಮುಂದೆ "ಅಧಿಕಾರ ನೀಡುವವರು" ಎಂದು ಕರೆಯಲ್ಪಡುವೆನು.</p>

          <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border">
            <div className="text-sm"><span className="text-muted-foreground">ಸಂಸ್ಥೆಯ ಹೆಸರು: </span><Filled>{COMPANY_NAME}</Filled></div>
            <div className="text-sm"><span className="text-muted-foreground">ನೋಂದಣಿ ಸಂಖ್ಯೆ: </span><Filled>{COMPANY_REG}</Filled></div>
            <div className="text-sm"><span className="text-muted-foreground">ವಿಳಾಸ: </span><Filled>{COMPANY_ADDRESS}</Filled></div>
            <div className="text-sm"><span className="text-muted-foreground">ಸಂಪರ್ಕ ಸಂಖ್ಯೆ: </span><Filled>{COMPANY_PHONE}</Filled></div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <p className="text-xs font-bold text-red-700">NOTE: ಈ ಪ್ರಾಧಿಕಾರ ಪತ್ರ ಕೇವಲ ದಾಖಲೆ ಕೆಲಸಗಳಿಗೆ ಮಾತ್ರ ಮಾನ್ಯವಾಗಿದ್ದು ಆಸ್ತಿ ಮಾರಾಟ, ವರ್ಗಾವಣೆ, ಗಿಫ್ಟ್ ಅಥವಾ ಹೂಡಿಕೆ ಮಾಡಲು ಬಳಸಲು ಅನುಮತಿಸಿಲ್ಲ.</p>
          </div>

          <div className="pt-4">
            <p className="text-sm text-foreground">ಅಧಿಕಾರ ನೀಡುವವರ ಸಹಿ: ________________</p>
            <p className="text-sm text-muted-foreground mt-1">(ಹೆಸರು: <Filled>{c.client_name || "___"}</Filled>)</p>
          </div>

          {/* Consent */}
          <div className="border-t border-border pt-4 mt-6">
            <div className="flex items-start gap-3">
              <Checkbox id="poa-consent" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
              <label htmlFor="poa-consent" className="text-xs text-muted-foreground leading-relaxed">
                I, <span className="font-semibold text-foreground">{c.client_name || "___"}</span>, hereby authorize Chilume Legal & Liaisoning Pvt. Ltd. (e-DigiVault) to act as my representative and Process Owner Authority for the purpose of handling and processing my service request. I acknowledge and consent to e-DigiVault securely managing my information in accordance with applicable laws and data protection guidelines.
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 flex gap-3 justify-center">
        <Button variant="outline" className="flex-1 h-12 border-primary text-primary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button className="flex-1 h-12" disabled={!agreed || saving} onClick={handleSubmit}>
          {saving ? "Signing..." : "Sign & Submit"}
        </Button>
      </div>
    </div>
  );
};

export default POA;
