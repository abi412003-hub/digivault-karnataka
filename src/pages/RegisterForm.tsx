import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, auth } = useAuth();
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      register(auth.phone || "9999999999", name);
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background px-5 py-6">
      <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center self-start">
        <ArrowLeft size={22} className="text-foreground" />
      </button>

      <h1 className="text-2xl font-bold text-foreground mt-4">Registration Form</h1>
      <p className="text-muted-foreground mb-6">Fill in your details to complete registration</p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">Full Name</label>
          <Input placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button className="w-full" onClick={handleSubmit}>
          Complete Registration
        </Button>
      </div>
    </div>
  );
};

export default RegisterForm;
