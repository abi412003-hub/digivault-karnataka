import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BottomTabs from "@/components/BottomTabs";
import { fetchList } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type TabKey = "Approved" | "Pending" | "Rejected";

interface DocListPageConfig {
  title: string;
  doctype: string;
  labelPrefix: string;
}

const CONFIG: Record<string, DocListPageConfig> = {
  "/proposals": { title: "Proposal", doctype: "DigiVault Proposal", labelPrefix: "Proposal" },
  "/estimates": { title: "Estimates", doctype: "DigiVault Estimate", labelPrefix: "Estimate" },
  "/invoices": { title: "Invoices", doctype: "DigiVault Invoice", labelPrefix: "Invoice" },
};

const TABS: TabKey[] = ["Approved", "Pending", "Rejected"];

const DocumentListPage = () => {
  const location = useLocation();
  const { auth } = useAuth();
  const config = CONFIG[location.pathname] || CONFIG["/proposals"];
  const [activeTab, setActiveTab] = useState<TabKey>("Approved");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchList(config.doctype, ["name"], [["client", "=", auth.client_id]])
      .then((data) => setItems(data?.length ? data : []))
      .catch(() => setItems([]));
  }, [config.doctype, auth.client_id]);

  const filtered = items.length
    ? items.filter((it: any) => (it.status || "Approved") === activeTab)
    : [1, 2, 3, 4]; // placeholder

  const searched = items.length
    ? filtered.filter((it: any) => !search || it.name?.toLowerCase().includes(search.toLowerCase()))
    : filtered;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <PageHeader title={config.title} />
      <div className="px-5 py-4 flex-1">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search here"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-3 mb-5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-primary text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {searched.map((item, i) => {
            const label = items.length
              ? `${config.labelPrefix} #${i + 1}`
              : `${config.labelPrefix} #${item}`;
            return (
              <div key={i} className="rounded-xl border border-border bg-background p-2">
                <div className="bg-muted/50 rounded-lg p-3 h-44 flex flex-col justify-between text-[10px] text-muted-foreground">
                  <span className="text-primary font-bold text-xs">e-DigiVault</span>
                  <div className="space-y-1 mt-2">
                    <div className="h-1.5 bg-border rounded w-full" />
                    <div className="h-1.5 bg-border rounded w-3/4" />
                  </div>
                  <div className="mt-2 border-t border-border pt-1 grid grid-cols-4 gap-1 text-[8px]">
                    <span>Item</span><span>Qty</span><span>Rate</span><span>Total</span>
                    <span>—</span><span>—</span><span>—</span><span>—</span>
                  </div>
                  <div className="mt-1 border-t border-border pt-1 space-y-0.5 text-[8px]">
                    <div className="flex justify-between"><span>Sub Total</span><span>—</span></div>
                    <div className="flex justify-between"><span>Discount</span><span>—</span></div>
                    <div className="flex justify-between font-bold"><span>Balance Due</span><span>—</span></div>
                  </div>
                </div>
                <button className="mt-2 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold">
                  <FileText size={14} />
                  {label}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <BottomTabs />
    </div>
  );
};

export default DocumentListPage;
