import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/onboarding", { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-[280px] h-[280px] rounded-full bg-splash flex items-center justify-center">
        <span className="text-gold font-bold text-[32px]">e-DigiVault</span>
      </div>
    </div>
  );
};

export default Splash;
