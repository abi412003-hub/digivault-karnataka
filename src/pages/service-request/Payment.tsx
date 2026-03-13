import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { fetchOne, updateRecord } from "@/lib/api";
import { srTransition, paymentTransition, projectTransition } from "@/lib/workflow";
import { useToast } from "@/hooks/use-toast";

const Payment = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // Direct update for progress
      await updateRecord("DigiVault Service Request", srId, {
        payment_status: "Paid",
        request_status: "In Progress",
        progress_steps_completed: 7,
        progress_percentage: 70,
      });
      // Workflow: only fire if SR hasn't already moved past payment stage
      const currentStatus = sr?.request_status;
      if (currentStatus && currentStatus !== "In Progress") {
        await srTransition("payment_done", srId).catch(() => {});
      }
      if (sr?.project) {
        const projData = await fetchOne("DigiVault Project", sr.project).catch(() => null);
        if (projData && projData.project_status !== "In Progress") {
          await projectTransition("service_paid", sr.project).catch(() => {});
        }
      }
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
          <div className="py-4 px-4 text-center">
            <span className="px-5 py-2 rounded-full bg-[hsl(217_91%_93%)] text-[hsl(217_91%_53%)] text-sm font-semibold">
              Select Charges
            </span>
          </div>
          <div className="bg-background p-4 space-y-3">
            <Row label="Project ID" value={sr?.project || "-"} />
            <Row label="Property Title" value={sr?.property_title || sr?.property || "-"} />
            <Row label="Main Service" value={sr?.main_service || "-"} />
            <Row label="Sub Service" value={sr?.sub_service || "-"} />
          </div>
        </div>

        {/* Charge button */}
        <button className="w-full mt-6 h-14 rounded-xl bg-[hsl(217_91%_53%)] text-white font-bold text-base">
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
            <button className="px-8 py-3 rounded-lg border-2 border-[hsl(217_91%_53%)] text-[hsl(217_91%_53%)] font-semibold bg-background" style={{ width: "60%" }}>
              Generate Payment
            </button>
          ) : (
            <button onClick={handlePay} className="px-8 py-3 rounded-lg bg-[hsl(217_91%_53%)] text-white font-semibold" style={{ width: "40%" }}>
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
