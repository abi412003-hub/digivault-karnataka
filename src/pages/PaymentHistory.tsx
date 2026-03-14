import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  X,
  IndianRupee,
} from "lucide-react";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList } from "@/lib/api";
import { format, parseISO } from "date-fns";

interface Payment {
  name: string;
  client: string;
  project: string;
  payment_type: string;
  item_reference: string;
  property_name: string;
  amount: number;
  payment_date: string;
  payment_status: string;
}

type FilterTab = "All" | "Received" | "Pending" | "Overdue";

const statusConfig: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  Received: { bg: "bg-[hsl(142_76%_90%)]", text: "text-[hsl(142_76%_36%)]", icon: CheckCircle2 },
  Pending: { bg: "bg-[hsl(38_92%_90%)]", text: "text-[hsl(21_90%_48%)]", icon: Clock },
  Overdue: { bg: "bg-[hsl(0_93%_94%)]", text: "text-[hsl(0_72%_51%)]", icon: AlertTriangle },
};

const fmtAmount = (n: number) =>
  "Rs. " + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtDate = (d: string) => {
  if (!d) return "-";
  try { return format(parseISO(d), "dd MMM yyyy"); } catch { return d; }
};

const PaymentHistory = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.client_id) return;
    fetchList(
      "DigiVault Payment",
      ["name", "client", "project", "payment_type", "item_reference", "property_name", "amount", "payment_date", "payment_status"],
      [["client", "=", auth.client_id]],
      100,
      "payment_date desc"
    )
      .then((data: Payment[]) => { if (data?.length) setPayments(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth.client_id]);

  const sumByStatus = (s: string) =>
    payments.filter((p) => p.payment_status === s).reduce((acc, p) => acc + (p.amount || 0), 0);

  const filtered = filter === "All" ? payments : payments.filter((p) => p.payment_status === filter);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const link = document.createElement("a");
      link.download = `receipt-${receipt?.name || "payment"}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Payment History</h1>
      </div>

      <div className="px-4 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: "Total Paid", status: "Received", color: "142_76%_36%", bgColor: "142_76%_90%" },
            { label: "Pending", status: "Pending", color: "21_90%_48%", bgColor: "38_92%_90%" },
            { label: "Overdue", status: "Overdue", color: "0_72%_51%", bgColor: "0_93%_94%" },
          ] as const).map((card) => (
            <div
              key={card.status}
              className={`rounded-xl p-3 flex flex-col items-center justify-center min-h-[80px] bg-[hsl(${card.bgColor})]`}
            >
              <span className={`text-lg font-bold text-[hsl(${card.color})]`}>
                {fmtAmount(sumByStatus(card.status))}
              </span>
              <span className={`text-[10px] font-medium text-[hsl(${card.color})] mt-0.5`}>
                {card.label}
              </span>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["All", "Received", "Pending", "Overdue"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Payment List */}
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading payments…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No payments found</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const cfg = statusConfig[p.payment_status] || statusConfig.Pending;
              const Icon = cfg.icon;
              const isOpen = expanded === p.name;

              return (
                <div key={p.name} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : p.name)}
                    className="w-full flex items-center gap-3 p-4"
                  >
                    <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={cfg.text} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {p.payment_type || "Payment"}{p.item_reference ? ` — ${p.item_reference}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtDate(p.payment_date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground">{fmtAmount(p.amount)}</span>
                      {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-0 border-t border-border space-y-2">
                      <Row label="Property" value={p.property_name || "-"} />
                      <Row label="Project" value={p.project || "-"} />
                      <Row label="Status" value={p.payment_status} />
                      <Row label="Receipt No" value={p.name} />
                      {p.payment_status === "Received" && (
                        <button
                          onClick={() => setReceipt(p)}
                          className="w-full mt-2 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                        >
                          View Receipt
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Sheet */}
      {receipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setReceipt(null)}>
          <div
            className="w-full max-w-md bg-background rounded-t-2xl p-5 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-foreground">Payment Receipt</h2>
              <button onClick={() => setReceipt(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div ref={receiptRef} className="bg-card border border-border rounded-xl p-5 space-y-3">
              {/* Logo header */}
              <div className="text-center pb-3 border-b border-border">
                <p className="text-lg font-bold text-primary">e-DigiVault</p>
                <p className="text-[10px] text-muted-foreground">Digital Property Management</p>
              </div>

              <Row label="Receipt No" value={receipt.name} />
              <Row label="Date" value={fmtDate(receipt.payment_date)} />
              <Row label="Client" value={receipt.client || "-"} />
              <Row label="Property" value={receipt.property_name || "-"} />
              <Row label="Service" value={receipt.payment_type || "-"} />
              <Row label="Reference" value={receipt.item_reference || "-"} />

              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Amount</span>
                <span className="text-lg font-bold text-foreground">{fmtAmount(receipt.amount)}</span>
              </div>

              <div className="flex justify-center pt-1">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[hsl(142_76%_90%)] text-[hsl(142_76%_36%)]">
                  Received
                </span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full mt-4 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download Receipt
            </button>
          </div>
        </div>
      )}

      <BottomTabs />
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-medium text-foreground text-right max-w-[60%] truncate">{value}</span>
  </div>
);

export default PaymentHistory;
