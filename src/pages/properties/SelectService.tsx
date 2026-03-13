import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";

const SelectService = () => (
  <div className="flex flex-col min-h-screen bg-background pb-20">
    <PageHeader title="Select Service" />
    <div className="flex-1 flex items-center justify-center px-4">
      <p className="text-muted-foreground text-sm text-center">Service selection will be available here.</p>
    </div>
    <BottomTabs />
  </div>
);

export default SelectService;
