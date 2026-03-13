import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { auth } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background px-5 py-6 pb-20">
      <h1 className="text-2xl font-bold text-foreground">Home</h1>
      <p className="text-muted-foreground mt-1">Welcome, {auth.name || "User"}!</p>
      <p className="text-xs text-muted-foreground mt-1">Client ID: {auth.client_id}</p>

      <div className="mt-8 flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Your dashboard content will appear here.</p>
      </div>

      <BottomTabs />
    </div>
  );
};

export default Dashboard;
