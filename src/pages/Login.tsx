import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const navigate = useNavigate();
  const { isLoggedIn, setAuth, lookupClient } = useAuth();
  const { toast } = useToast();

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Register state
  const [regPhone, setRegPhone] = useState("");
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtp, setRegOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [regSending, setRegSending] = useState(false);
  const [regVerifying, setRegVerifying] = useState(false);
  const [regResendTimer, setRegResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard", { replace: true });
  }, [isLoggedIn, navigate]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  useEffect(() => {
    if (regResendTimer <= 0) return;
    const id = setTimeout(() => setRegResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [regResendTimer]);

  const cleanPhone = (p: string) => p.replace(/\D/g, "").slice(0, 10);

  /* ── Login OTP ── */
  const handleSendOtp = async () => {
    const cleaned = cleanPhone(phone);
    if (cleaned.length < 10) {
      toast({ title: "Enter a valid 10-digit number", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: "+91" + cleaned });
    setSending(false);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      setOtpSent(true);
      setResendTimer(30);
      toast({ title: "OTP sent!" });
    }
  };

  const handleVerifyLogin = async () => {
    const cleaned = cleanPhone(phone);
    if (otp.length !== 6) {
      toast({ title: "Enter 6-digit OTP", variant: "destructive" });
      return;
    }
    setVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: "+91" + cleaned,
      token: otp,
      type: "sms",
    });
    setVerifying(false);
    if (error) {
      toast({ title: error.message || "Invalid OTP", variant: "destructive" });
      return;
    }
    // OTP verified — proceed whether or not session is immediately available
    await handlePostVerify(cleaned, data?.user?.id || "");
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    const cleaned = cleanPhone(phone);
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: "+91" + cleaned });
    setSending(false);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      setResendTimer(30);
      toast({ title: "OTP resent!" });
    }
  };

  /* ── Register OTP ── */
  const handleRegSendOtp = async () => {
    const cleaned = cleanPhone(regPhone);
    if (cleaned.length < 10) {
      toast({ title: "Enter a valid 10-digit number", variant: "destructive" });
      return;
    }
    setRegSending(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: "+91" + cleaned });
    setRegSending(false);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      setRegOtpSent(true);
      setRegResendTimer(30);
      toast({ title: "OTP sent!" });
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

  const handleRegVerify = async () => {
    const cleaned = cleanPhone(regPhone);
    const otpValue = regOtp.join("");
    if (otpValue.length !== 6) {
      toast({ title: "Enter 6-digit OTP", variant: "destructive" });
      return;
    }
    setRegVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: "+91" + cleaned,
      token: otpValue,
      type: "sms",
    });
    setRegVerifying(false);
    if (error) {
      toast({ title: error.message || "Invalid OTP", variant: "destructive" });
      return;
    }
    // OTP verified — proceed
    setShowRegister(false);
    await handlePostVerify(cleaned, data?.user?.id || "");
  };

  const handleRegResend = async () => {
    if (regResendTimer > 0) return;
    const cleaned = cleanPhone(regPhone);
    setRegSending(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: "+91" + cleaned });
    setRegSending(false);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      setRegResendTimer(30);
      toast({ title: "OTP resent!" });
    }
  };

  /* ── Post-verify: lookup client in ERPNext ── */
  const handlePostVerify = useCallback(async (phone: string, supabaseUserId: string) => {
    try {
      const client = await lookupClient(phone);
      if (client) {
        setAuth({
          client_id: client.name,
          name: client.client_name,
          phone,
          registrationType: client.registration_type || "",
          supabaseUserId,
        });
        toast({ title: `Welcome back, ${client.client_name}!` });
        navigate("/dashboard", { replace: true });
      } else {
        setAuth((prev) => ({ ...prev, phone, supabaseUserId }));
        toast({ title: "Phone verified! Complete your registration." });
        navigate("/register-type", { replace: true });
      }
    } catch {
      // If lookupClient fails, still proceed to registration
      setAuth((prev) => ({ ...prev, phone, supabaseUserId }));
      toast({ title: "Phone verified! Complete your registration." });
      navigate("/register-type", { replace: true });
    }
  }, [lookupClient, setAuth, toast, navigate]);

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
              maxLength={10}
            />
          </div>
          <Button className="w-full" onClick={handleSendOtp} disabled={sending}>
            {sending ? "Sending..." : "Send OTP"}
          </Button>
        </div>

        {otpSent && (
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-foreground">Enter OTP</label>
            <div className="relative">
              <Input
                placeholder="******"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
            <p
              onClick={handleResend}
              className={`text-right text-xs cursor-pointer ${resendTimer > 0 ? "text-muted-foreground" : "text-primary"}`}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
            </p>
            <Button className="w-full" onClick={handleVerifyLogin} disabled={verifying}>
              {verifying ? "Verifying..." : "Verify"}
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
                maxLength={10}
              />
            </div>

            {!regOtpSent ? (
              <Button className="w-full" onClick={handleRegSendOtp} disabled={regSending}>
                {regSending ? "Sending..." : "Send OTP"}
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
                <p
                  onClick={handleRegResend}
                  className={`text-right text-xs cursor-pointer ${regResendTimer > 0 ? "text-muted-foreground" : "text-primary"}`}
                >
                  {regResendTimer > 0 ? `Resend in ${regResendTimer}s` : "Resend Code"}
                </p>
                <Button
                  variant="outline"
                  className="w-full border-primary text-primary"
                  onClick={handleRegVerify}
                  disabled={regVerifying}
                >
                  {regVerifying ? "Verifying..." : "Verify"}
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
