import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { updateRecord } from "@/lib/api";
import { srTransition } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";

const paragraphs = [
  "This power of attorney authorizes another person (your agent) to make decisions concerning your property for you (the principal). Your agent will be able to make decisions and act with respect to your property (including your money) whether or not you are able to act for yourself.",
  "This power of attorney does not authorize the agent to make medical and health care decisions for you.",
  "You should select someone you trust to serve as your agent. Unless you specify otherwise, generally the agent's authority will continue until you die or revoke the power of attorney or the agent resigns or is unable to act for you.",
  "Your agent is entitled to reasonable compensation unless you state otherwise in the Special Instructions.",
  "This form provides for designation of one agent. If you wish to name more than one agent you may name a co-agent in the Special Instructions. Co-agents are not required to act together unless you include that requirement in the Special Instructions.",
];

const POA = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { toast } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) return;
    setSaving(true);
    try {
      await Promise.allSettled([
        updateRecord("DigiVault Client", auth.client_id, { poa_consent: 1 }),
        updateRecord("DigiVault Service Request", srId!, { poa_signed: 1 }),
      ]);
      toast({ title: "POA consent submitted!" });
      navigate(`/service-request/${encodeURIComponent(srId!)}/esign`, { replace: true });
    } catch {
      navigate(`/service-request/${encodeURIComponent(srId!)}/esign`, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 space-y-5">
        <h1 className="text-xl font-bold text-foreground">Concern Authority Letter</h1>

        <p className="text-center font-bold uppercase text-foreground">IMPORTANT INFORMATION</p>

        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-muted-foreground leading-[1.7]">{p}</p>
        ))}

        <p className="text-center font-bold uppercase text-sm text-foreground pt-2">DESIGNATION OF AGENT</p>

        <p className="text-sm text-muted-foreground leading-[1.7]">
          I, _____________ of _____________ [Address], authorize _____________ of _____________ [Address], as my agent (attorney-in-fact) to act for me and in my name and for my use and benefit.
        </p>

        {/* Profile photo */}
        <div className="flex justify-center py-2">
          <div className="w-[60px] h-[60px] rounded-full bg-muted border border-input flex items-center justify-center">
            <User size={28} className="text-muted-foreground" />
          </div>
        </div>

        {/* Consent checkbox */}
        <div className="flex items-start gap-3">
          <Checkbox id="poa-consent" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
          <label htmlFor="poa-consent" className="text-xs text-muted-foreground leading-relaxed">
            I hereby authorize e-DigiVault to act as my representative and Process Owner Authority (POA) for the purpose of handling and processing my service request. I acknowledge and consent e-DigiVault securely managing my information in accordance with applicable laws and data protection guidelines.
          </label>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 flex gap-3 justify-center">
        <Button variant="outline" className="w-[45%] h-12 border-primary text-primary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button className="w-[45%] h-12" disabled={!agreed || saving} onClick={handleSubmit}>
          {saving ? "Submitting…" : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default POA;
