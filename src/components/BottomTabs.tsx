import { Home, Building2, IndianRupee, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/properties", label: "Properties", icon: Building2 },
  { path: "/transactions", label: "Transactions", icon: IndianRupee },
  { path: "/settings", label: "Settings", icon: Settings },
];

const BottomTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabs;
