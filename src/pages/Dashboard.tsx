import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  MessageSquare,
  User,
  Users,
  ListTodo,
  FileText,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  PlayCircle,
  BookOpen,
  BarChart3,
  Video,
  MapPin,
} from "lucide-react";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList, getFileUrl } from "@/lib/api";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";

/* ── helpers ── */
const fmtCurrency = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtDate = (d: string) => {
  try { return format(parseISO(d), "dd MMM yyyy"); } catch { return d; }
};

const daysSince = (d: string) => {
  try {
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  } catch { return 0; }
};

/* ── status badge ── */
const statusStyles: Record<string, { bg: string; text: string }> = {
  Completed: { bg: "bg-[hsl(142_76%_90%)]", text: "text-[hsl(142_76%_36%)]" },
  "On Going": { bg: "bg-[hsl(217_91%_93%)]", text: "text-[hsl(224_76%_48%)]" },
  "In Progress": { bg: "bg-[hsl(217_91%_93%)]", text: "text-[hsl(224_76%_48%)]" },
  Pending: { bg: "bg-[hsl(48_96%_89%)]", text: "text-[hsl(38_92%_50%)]" },
  Draft: { bg: "bg-[hsl(48_96%_89%)]", text: "text-[hsl(38_92%_50%)]" },
  Uploaded: { bg: "bg-[hsl(270_82%_94%)]", text: "text-[hsl(263_70%_50%)]" },
  Rejected: { bg: "bg-[hsl(0_93%_94%)]", text: "text-[hsl(0_72%_51%)]" },
};

const Badge = ({ status }: { status: string }) => {
  const s = statusStyles[status] ?? statusStyles.Pending;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
};

const fallbackActivity = [
  { name: "DOC-001", document_title: "E-khatha Certificate", document_date: "2025-04-08", document_status: "Completed" },
  { name: "DOC-002", document_title: "Khatha Certificate", document_date: "2025-04-06", document_status: "On Going" },
  { name: "DOC-003", document_title: "Khatha Extract", document_date: "2025-04-05", document_status: "Pending" },
];

const Dashboard = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();

  /* BD identity — try localStorage first, fall back to auth context */
  const bdUser = (() => {
    try {
      const stored = localStorage.getItem("edv_bd_user");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  })();
  const bdName = bdUser?.full_name || bdUser?.bd_name || auth.name || "BD User";
  const bdId = bdUser?.name || bdUser?.bd_id || auth.client_id || "";

  /* ── state ── */
  const [loading, setLoading] = useState(true);
  const [newLeads, setNewLeads] = useState(0);
  const [tasksDue, setTasksDue] = useState(0);
  const [pendingProposals, setPendingProposals] = useState(0);

  // funnel
  const [totalLeads, setTotalLeads] = useState(0);
  const [verifiedLeads, setVerifiedLeads] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [proposalsSent, setProposalsSent] = useState(0);
  const [paidInvoices, setPaidInvoices] = useState(0);

  // revenue
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [revenueLastMonth, setRevenueLastMonth] = useState(0);

  // pipeline
  const [pipeline, setPipeline] = useState<any[]>([]);

  // activity
  const [activity, setActivity] = useState(fallbackActivity);

  const today = format(new Date(), "yyyy-MM-dd");
  const thisMonthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const thisMonthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const lastMonthStart = format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd");
  const lastMonthEnd = format(endOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd");

  useEffect(() => {
    const load = async () => {
      try {
        const [
          leadsToday,
          tasks,
          proposals,
          allLeads,
          verified,
          clients,
          sentProposals,
          paid,
          paymentsThis,
          paymentsLast,
          projects,
          docs,
        ] = await Promise.allSettled([
          // Section 1 — today's stats
          fetchList("DigiVault Lead", ["name"], [["creation", ">=", today]], 0),
          fetchList("DigiVault Task", ["name"], [["assigned_to", "=", bdId], ["task_status", "in", ["Not Started", "On Going"]]], 0),
          fetchList("DigiVault Proposal", ["name"], [["proposal_status", "=", "Pending"]], 0),
          // Section 2 — funnel
          fetchList("DigiVault Lead", ["name"], [], 0),
          fetchList("DigiVault Lead", ["name"], [["lead_status", "=", "Verified"]], 0),
          fetchList("DigiVault Client", ["name"], [], 0),
          fetchList("DigiVault Proposal", ["name"], [["proposal_status", "!=", "Draft"]], 0),
          fetchList("DigiVault Invoice", ["name"], [["invoice_status", "=", "Paid"]], 0),
          // Section 3 — revenue
          fetchList("DigiVault Payment", ["amount"], [["payment_date", ">=", thisMonthStart], ["payment_date", "<=", thisMonthEnd], ["payment_status", "=", "Received"]], 0),
          fetchList("DigiVault Payment", ["amount"], [["payment_date", ">=", lastMonthStart], ["payment_date", "<=", lastMonthEnd], ["payment_status", "=", "Received"]], 0),
          // Section 4 — pipeline
          fetchList("DigiVault Project", ["name", "project_name", "client", "service", "creation"], [["assigned_bd", "=", bdId], ["project_status", "=", "In Progress"]], 10, "creation desc"),
          // Section 5 — recent activity
          fetchList("DigiVault Client Document", ["name", "document_title", "document_date", "document_status"], [], 6, "creation desc"),
        ]);

        const len = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? (r.value?.length ?? 0) : 0;
        const val = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? (r.value ?? []) : [];

        setNewLeads(len(leadsToday));
        setTasksDue(len(tasks));
        setPendingProposals(len(proposals));

        setTotalLeads(len(allLeads));
        setVerifiedLeads(len(verified));
        setTotalClients(len(clients));
        setProposalsSent(len(sentProposals));
        setPaidInvoices(len(paid));

        const sumAmount = (arr: any[]) => arr.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0);
        setRevenueThisMonth(sumAmount(val(paymentsThis)));
        setRevenueLastMonth(sumAmount(val(paymentsLast)));

        setPipeline(val(projects));
        if (val(docs).length) setActivity(val(docs));
      } catch {}
      setLoading(false);
    };
    load();
  }, [bdId, today, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd]);

  /* ── Funnel helper ── */
  const funnelStages = [
    { label: "Leads", count: totalLeads, color: "hsl(220, 14%, 70%)" },
    { label: "Verified", count: verifiedLeads, color: "hsl(var(--primary))" },
    { label: "Clients", count: totalClients, color: "hsl(180, 60%, 45%)" },
    { label: "Proposals", count: proposalsSent, color: "hsl(263, 70%, 50%)" },
    { label: "Paid", count: paidInvoices, color: "hsl(var(--success))" },
  ];
  const maxFunnel = Math.max(...funnelStages.map((s) => s.count), 1);

  const convRate = (from: number, to: number) =>
    from > 0 ? Math.round((to / from) * 100) + "%" : "–";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        <h1 className="text-[22px] font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Bell size={18} className="text-primary" />
          </span>
          <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <MessageSquare size={18} className="text-primary" />
          </span>
          <span className="w-10 h-10 rounded-full border border-input bg-muted flex items-center justify-center overflow-hidden">
            <User size={18} className="text-muted-foreground" />
          </span>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* ═══ SECTION 1 — Greeting + Today's Stats ═══ */}
        <section className="rounded-xl bg-primary p-4">
          <p className="text-primary-foreground text-lg font-bold">{greeting}, {bdName.split(" ")[0]}!</p>
          <p className="text-primary-foreground/70 text-xs mt-0.5">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "New Leads", value: newLeads, icon: Users },
              { label: "Tasks Due", value: tasksDue, icon: ListTodo },
              { label: "Pending Proposals", value: pendingProposals, icon: FileText },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-primary-foreground/15 p-3 flex flex-col items-center">
                <m.icon size={16} className="text-primary-foreground/80 mb-1" />
                <span className="text-xl font-bold text-primary-foreground">{m.value}</span>
                <span className="text-[10px] text-primary-foreground/70 text-center leading-tight mt-0.5">{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 2 — Conversion Funnel ═══ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Conversion Funnel</span>
          </div>
          <div className="rounded-xl border border-border p-4 space-y-2">
            {funnelStages.map((stage, i) => {
              const widthPct = Math.max((stage.count / maxFunnel) * 100, 12);
              return (
                <div key={stage.label}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 rounded-md flex items-center px-3 transition-all duration-500"
                      style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                    >
                      <span className="text-xs font-bold text-white truncate">{stage.count}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{stage.label}</span>
                  </div>
                  {i < funnelStages.length - 1 && (
                    <p className="text-[10px] text-muted-foreground ml-2 mt-0.5">
                      → {convRate(stage.count, funnelStages[i + 1].count)} conversion
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ SECTION 3 — Revenue This Month ═══ */}
        <section className="rounded-xl bg-[hsl(142_76%_90%)] p-4">
          <p className="text-xs font-medium text-[hsl(142_76%_36%)]">Revenue This Month</p>
          <p className="text-2xl font-bold text-[hsl(142_76%_36%)] mt-1">{fmtCurrency(revenueThisMonth)}</p>
          <p className="text-xs text-[hsl(142_76%_36%)]/70 mt-1">
            vs last month {fmtCurrency(revenueLastMonth)}
          </p>
        </section>

        {/* ═══ SECTION 4 — Active Pipeline ═══ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">My Active Pipeline</span>
          </div>
          {pipeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active projects</p>
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {pipeline.map((p: any) => (
                <button
                  key={p.name}
                  onClick={() => navigate(`/clients/projects/details`)}
                  className="w-full rounded-xl border border-border p-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-primary" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.project_name || p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.client} • {p.service || "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-muted-foreground">{daysSince(p.creation)}d</span>
                    <ChevronRight size={14} className="text-muted-foreground ml-1 inline" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ═══ Quick Actions ═══ */}
        <section className="grid grid-cols-4 gap-2">
          {[
            { label: "Brochure", icon: BookOpen },
            { label: "Rate Chart", icon: BarChart3 },
            { label: "Service Docs", icon: FileText },
            { label: "Video Promo", icon: Video },
          ].map((a) => (
            <button
              key={a.label}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors"
            >
              <a.icon size={18} className="text-primary" />
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </section>

        {/* ═══ Live Tracking ═══ */}
        <button
          onClick={() => navigate("/service-tracker")}
          className="w-full rounded-xl bg-secondary px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors"
        >
          <PlayCircle size={20} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Live Tracking</span>
          <ChevronRight size={16} className="text-muted-foreground ml-auto" />
        </button>

        {/* ═══ SECTION 5 — Recent Activity ═══ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={16} className={`text-primary ${loading ? "animate-spin" : ""}`} />
            <span className="text-sm font-semibold text-foreground">Recent Activity</span>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_90px_90px] bg-secondary px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground">Document Title</span>
              <span className="text-xs font-semibold text-muted-foreground text-center">Date</span>
              <span className="text-xs font-semibold text-muted-foreground text-center">Status</span>
            </div>
            {activity.map((item: any, i: number) => (
              <div
                key={item.name + i}
                className={`grid grid-cols-[1fr_90px_90px] px-3 py-2.5 items-center ${
                  i < activity.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-sm text-foreground truncate pr-2">{item.document_title}</span>
                <span className="text-xs text-muted-foreground text-center">{fmtDate(item.document_date)}</span>
                <span className="flex justify-center">
                  <Badge status={item.document_status} />
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomTabs />
    </div>
  );
};

export default Dashboard;
