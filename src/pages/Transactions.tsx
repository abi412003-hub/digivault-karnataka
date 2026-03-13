import BottomTabs from "@/components/BottomTabs";

const Transactions = () => (
  <div className="flex flex-col min-h-screen bg-background px-5 py-6 pb-20">
    <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
    <div className="mt-8 flex-1 flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Your transactions will appear here.</p>
    </div>
    <BottomTabs />
  </div>
);

export default Transactions;
