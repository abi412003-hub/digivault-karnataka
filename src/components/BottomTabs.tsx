import { useEffect, useState } from "react";
import { Home, Building2, IndianRupee, MessageSquare, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList } from "@/lib/api";

const tabs = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/properties", label: "Properties", icon: Building2 },
  { path: "/messages", label: "Messages", icon: MessageSquare },
  { path: "/transactions", label: "Transactions", icon: IndianRupee },
  { path: "/settings", label: "Settings", icon: Settings },
];

const BottomTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    // BD perspective: unread = non-BD messages
    fetchList(
      "DigiVault Message",
      ["name"],
      [
        ["is_read", "=", 0],
        ["sender_role", "!=", "BD"],
      ]
    )
      .then((data: any[]) => setUnread(data?.length ?? 0))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const active =
            location.pathname === tab.path ||
            (tab.path === "/messages" && location.pathname.startsWith("/messages"));
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon size={22} />
                {tab.path === "/messages" && unread > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabs;
