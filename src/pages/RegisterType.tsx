import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Building2, Landmark, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";

const types = [
  { key: "individual", label: "Individual", icon: User, note: "Register as an Individual for Personal use." },
  { key: "organization", label: "Organization", icon: Building2, note: "Register as a Business or Organization." },
  { key: "land_aggregator", label: "Land Aggregator", icon: Landmark, note: "Register as a Land Aggregator." },
];

const RegisterType = () => {
  const navigate = useNavigate();
  const { setRegistrationType } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSelect = (key: string) => {
    setSelected(key);
    setAgreed(false);
    setShowSheet(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background px-5 py-6">
      {/* Top bar */}
      <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center self-start">
        <ArrowLeft size={22} className="text-foreground" />
      </button>

      <div className="text-center space-y-2 mt-4">
        <h1 className="text-2xl font-bold text-foreground">Welcome to e-DigiVault</h1>
        <p className="text-muted-foreground">Secure Access to Documents</p>
      </div>

      <p className="text-foreground font-medium mt-8 mb-4">Please choose how you'd like to Register</p>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-4">
        {types.slice(0, 2).map((t) => {
          const Icon = t.icon;
          const active = selected === t.key;
          return (
            <button
              key={t.key}
              onClick={() => handleSelect(t.key)}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 min-h-[120px] transition-colors ${
                active ? "bg-splash text-splash-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <Icon size={28} />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-center mt-4">
        {(() => {
          const t = types[2];
          const Icon = t.icon;
          const active = selected === t.key;
          return (
            <button
              key={t.key}
              onClick={() => handleSelect(t.key)}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 min-h-[120px] w-[calc(50%-8px)] transition-colors ${
                active ? "bg-splash text-splash-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <Icon size={28} />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          );
        })()}
      </div>

      {/* Notes */}
      <div className="mt-6 space-y-1">
        {types.map((t) => (
          <p key={t.key} className="text-xs text-muted-foreground">{t.note}</p>
        ))}
      </div>

      {/* Bottom sheet */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md bg-background rounded-t-2xl border-t-4 border-primary px-5 py-6 space-y-4 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center">
              <span />
              <h3 className="text-lg font-bold text-primary">
                {types.find((t) => t.key === selected)?.label}
              </h3>
              <button onClick={() => setShowSheet(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <span className="text-primary underline cursor-pointer">Terms & Conditions</span>{" "}
                and{" "}
                <span className="text-primary underline cursor-pointer">Privacy Policy</span>.
              </label>
            </div>

            <Button
              className="w-full"
              disabled={!agreed}
              onClick={() => {
                if (selected) setRegistrationType(selected);
                navigate("/register-form", { replace: true });
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterType;
