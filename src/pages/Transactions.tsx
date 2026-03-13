import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { fetchList } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface TxRow {
  item: string;
  project: string;
  property: string;
}

const PLACEHOLDER: TxRow[] = [
  { item: "GAP Analysis", project: "Cruside Project", property: "Ashwin Villa" },
  { item: "Invoice #1", project: "Land change", property: "Orchid Villa" },
  { item: "Invoice #2", project: "Anitha Apartment", property: "Sunrise Apartments" },
  { item: "Invoice #3", project: "Bella Apartments", property: "Bella Apartments" },
];

const Transactions = () => {
  const { auth } = useAuth();
  const [rows, setRows] = useState<TxRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [gaps, invoices] = await Promise.all([
          fetchList("DigiVault GAP Analysis", ["name"], [["client", "=", auth.client_id]]),
          fetchList("DigiVault Invoice", ["name"], [["client", "=", auth.client_id]]),
        ]);
        const combined: TxRow[] = [];
        if (gaps?.length) gaps.forEach((g: any) => combined.push({ item: "GAP Analysis", project: g.name || "", property: "" }));
        if (invoices?.length) invoices.forEach((inv: any, i: number) => combined.push({ item: `Invoice #${i + 1}`, project: inv.name || "", property: "" }));
        setRows(combined.length ? combined : PLACEHOLDER);
      } catch {
        setRows(PLACEHOLDER);
      }
    };
    load();
  }, [auth.client_id]);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title="Transactions" />
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-foreground">Transactions</h2>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-3 bg-secondary px-3 py-2.5">
            <span className="text-xs font-semibold text-foreground">Item</span>
            <span className="text-xs font-semibold text-foreground">Project Name</span>
            <span className="text-xs font-semibold text-foreground">Property Name</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className={`grid grid-cols-3 px-3 py-3 border-b border-border/50 ${i % 2 === 1 ? "bg-muted/30" : "bg-background"}`}>
              <span className="text-sm font-bold text-foreground">{row.item}</span>
              <span className="text-sm text-foreground">{row.project}</span>
              <span className="text-sm text-foreground">{row.property}</span>
            </div>
          ))}
        </div>
      </div>
      <BottomTabs />
    </div>
  );
};

export default Transactions;
