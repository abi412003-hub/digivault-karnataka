import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { fetchOne, updateRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Payment = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);
  const [sr, setSr] = useState<any>(null);

  useEffect(() => {
    if (srId) {
      fetchOne("DigiVault Service Request", srId).then((data) => {
        if (data) setSr(data);
      }).catch(() => {});
    }
  }, [srId]);

  const handlePay = async () => {
    if (!srId) return;
    try {
      await updateRecord("DigiVault Service Request", srId, {
        payment_status: "Paid",
        request_status: "In Progress",
        progress_steps_completed: 7,
        progress_percentage: 70,
      });
      toast({ title: "Payment successful!" });
      navigate("/dashboard");
    } catch {
      toast({ title: "Payment failed", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center bg-background px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 px-5 py-6 pb-24">
        {/* Top card */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-blue-100 py-4 px-4 text-center">
            <h2 className="text-lg font-bold text-foreground">Select Charges</h2>
          </div>
          <div className="bg-background p-4 space-y-3">
            <Row label="Project ID" value={sr?.project || "PR-784516"} />
            <Row label="Property Title" value={sr?.property_title || sr?.property || "Ashwin Villa"} />
            <Row label="Main Service" value={sr?.main_service || "E-katha"} />
            <Row label="Sub Service" value={sr?.sub_service || "New E-Katha Registration"} />
          </div>
        </div>

        {/* Charge button */}
        <button className="w-full mt-6 h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base">
          Basic Investigation / Legal Charges
        </button>

        {/* T&C */}
        <div className="mt-6 flex items-start gap-3">
          <Checkbox
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm text-foreground">click here to accept Terms &amp; Conditions</span>
        </div>

        <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
          By signing in, creating an account i am agreeing to e-DigiVault{" "}
          <span className="text-primary underline cursor-pointer">Terms &amp; Conditions</span> and to our{" "}
          <span className="text-primary underline cursor-pointer">Privacy Policy</span>
        </p>

        {/* Action button */}
        <div className="flex justify-center mt-6">
          {!accepted ? (
            <button className="px-8 py-3 rounded-lg border-2 border-primary text-primary font-semibold bg-background" style={{ width: "60%" }}>
              Generate Payment
            </button>
          ) : (
            <button onClick={handlePay} className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold" style={{ width: "40%" }}>
              Pay Now
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground italic">
          This Amount is Generated Based on Your Service Selection only For Gap Analysis.
        </p>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center">
    <span className="font-bold italic text-foreground text-sm">{label}</span>
    <span className="text-foreground text-sm">{value}</span>
  </div>
);

export default Payment;
