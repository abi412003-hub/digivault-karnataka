import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Register state
  const [regPhone, setRegPhone] = useState("");
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtp, setRegOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = () => {
    if (phone.length >= 10) setOtpSent(true);
  };

  const handleVerifyLogin = () => {
    if (otp.length === 6) {
      login(phone);
      navigate("/register-type", { replace: true });
    }
  };

  const handleRegOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const next = [...regOtp];
    next[index] = value;
    setRegOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleRegVerify = () => {
    if (regOtp.every((d) => d !== "")) {
      login(regPhone);
      setShowRegister(false);
      navigate("/register-type", { replace: true });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background px-5 py-10 justify-center">
      <div className="max-w-md mx-auto w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Welcome to e-DigiVault</h1>
          <p className="text-muted-foreground">Secure Access to Documents</p>
        </div>

        <div className="space-y-4 pt-6">
          <label className="text-sm font-medium text-foreground">Enter Your Mobile Number</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="9812546586"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10"
              type="tel"
            />
          </div>
          <Button className="w-full" onClick={handleSendOtp}>
            Send OTP
          </Button>
        </div>

        {otpSent && (
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-foreground">Enter OTP</label>
            <div className="relative">
              <Input
                placeholder="******"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                type={showOtp ? "text" : "password"}
                maxLength={6}
                className="pr-10"
              />
              <button
                onClick={() => setShowOtp(!showOtp)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showOtp ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-right text-xs text-muted-foreground cursor-pointer">Resend Code</p>
            <Button className="w-full" onClick={handleVerifyLogin}>
              Verify
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground pt-4">
          Don't have an account?{" "}
          <button onClick={() => setShowRegister(true)} className="text-primary underline font-medium">
            Register
          </button>
        </p>
      </div>

      {/* Register bottom sheet */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md bg-background rounded-t-2xl border-t-4 border-primary px-5 py-6 space-y-4 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center">
              <span />
              <h3 className="text-lg font-bold text-primary">Register</h3>
              <button onClick={() => setShowRegister(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <label className="text-sm font-medium text-foreground">Enter Your Mobile Number</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="9812546586"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="pl-10"
                type="tel"
              />
            </div>

            {!regOtpSent ? (
              <Button className="w-full" onClick={() => regPhone.length >= 10 && setRegOtpSent(true)}>
                Send OTP
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {regOtp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleRegOtpChange(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !digit && i > 0) otpRefs.current[i - 1]?.focus();
                      }}
                      className="w-[45px] h-[45px] text-center text-2xl font-bold border-2 border-primary rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ))}
                </div>
                <p className="text-right text-xs text-muted-foreground cursor-pointer">Resend Code</p>
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary"
                  onClick={handleRegVerify}
                >
                  Verify
                </Button>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => setShowRegister(false)} className="text-primary underline font-medium">
                Login
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
