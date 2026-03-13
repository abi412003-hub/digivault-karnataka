import BottomTabs from "@/components/BottomTabs";

const SettingsPage = () => (
  <div className="flex flex-col min-h-screen bg-background px-5 py-6 pb-20">
    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
    <div className="mt-8 flex-1 flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Settings will appear here.</p>
    </div>
    <BottomTabs />
  </div>
);

export default SettingsPage;
