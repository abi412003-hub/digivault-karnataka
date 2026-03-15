import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import onboarding1 from "@/assets/onboarding-1.jpeg";
import onboarding2 from "@/assets/onboarding-2.jpeg";
import onboarding3 from "@/assets/onboarding-3.jpeg";

const pages = [
  {
    title: "Upload with Confidence",
    description: "Moderators can securely upload documents with detailed metadata.",
    image: onboarding1,
  },
  {
    title: "Safe and Secure",
    description: "In-Charge roles review, verify, or reject documents — transparently.",
    image: onboarding2,
  },
  {
    title: "Track Everything",
    description: "Real-time tracking of all your property documents and services.",
    image: onboarding3,
  },
];

const Onboarding = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (current < pages.length - 1) setCurrent(current + 1);
    else navigate("/login", { replace: true });
  };

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background px-5 py-6">
      {/* Top bar */}
      <div className="flex justify-between items-center">
        <button onClick={prev} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="text-muted-foreground text-sm min-h-[44px] px-2"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Illustration placeholder */}
        <div className="w-full max-w-[300px] h-[250px] rounded-2xl bg-secondary flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Illustration</span>
        </div>

        <h2 className="text-xl font-bold text-primary text-center">{pages[current].title}</h2>
        <p className="text-muted-foreground italic text-center text-sm max-w-[280px]">
          {pages[current].description}
        </p>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-4 pb-4">
        <button
          onClick={next}
          className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center"
        >
          <ChevronRight size={22} className="text-primary" />
        </button>

        <div className="flex gap-2">
          {pages.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                i === current ? "bg-primary" : "border border-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
