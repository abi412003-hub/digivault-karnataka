import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  MessageSquare,
  User,
  BarChart3,
  CheckCircle,
  Hourglass,
  Clock,
  Landmark,
  FileText,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList, fetchOne, getFileUrl } from "@/lib/api";
import { format, parseISO } from "date-fns";

/* ── status badge colors ── */
const statusStyles: Record<string, { bg: string; text: string }> = {
  Completed: { bg: "bg-[hsl(142_76%_90%)]", text: "text-[hsl(142_76%_36%)]" },
  "On Going": { bg: "bg-[hsl(217_91%_93%)]", text: "text-[hsl(224_76%_48%)]" },
  "In Progress": { bg: "bg-[hsl(217_91%_93%)]", text: "text-[hsl(224_76%_48%)]" },
  Pending: { bg: "bg-[hsl(48_96%_89%)]", text: "text-[hsl(38_92%_50%)]" },
  Draft: { bg: "bg-[hsl(48_96%_89%)]", text: "text-[hsl(38_92%_50%)]" },
  Uploaded: { bg: "bg-[hsl(270_82%_94%)]", text: "text-[hsl(263_70%_50%)]" },
  Rejected: { bg: "bg-[hsl(0_93%_94%)]", text: "text-[hsl(0_72%_51%)]" },
};

const fallbackActivity = [
  { name: "DOC-001", document_title: "E-khatha Certificate", document_date: "2025-04-08", document_status: "Completed" },
  { name: "DOC-002", document_title: "Khatha Certificate", document_date: "2025-04-06", document_status: "On Going" },
  { name: "DOC-003", document_title: "Khatha Extract", document_date: "2025-04-05", document_status: "Pending" },
  { name: "DOC-004", document_title: "Tax Paid Receipt", document_date: "2025-04-05", document_status: "Pending" },
  { name: "DOC-005", document_title: "Building Plan Approval", document_date: "2025-04-05", document_status: "Pending" },
  { name: "DOC-006", document_title: "Assessment Book", document_date: "2025-04-05", document_status: "Pending" },
];

const Dashboard = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const clientId = auth.client_id;

  const [completed, setCompleted] = useState(0);
  const [ongoing, setOngoing] = useState(0);
  const [pending, setPending] = useState(0);
  const [projects, setProjects] = useState(0);
  const [activity, setActivity] = useState(fallbackActivity);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState("");
  const [gapIssueCount, setGapIssueCount] = useState(0);
  const [gapStatus, setGapStatus] = useState("");

  useEffect(() => {
    if (clientId) {
      fetchOne("DigiVault Client", clientId)
        .then((data: any) => {
          if (data?.client_photo) {
            setPhotoUrl(getFileUrl(data.client_photo));
          }
        })
        .catch(() => {});
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    const load = async () => {
      try {
        const [compRes, onRes, penRes, projRes, actRes, gapRes] = await Promise.allSettled([
          fetchList("DigiVault Service Request", ["name"], [["client", "=", clientId], ["request_status", "=", "Completed"]]),
          fetchList("DigiVault Service Request", ["name"], [["client", "=", clientId], ["request_status", "=", "In Progress"]]),
          fetchList("DigiVault Service Request", ["name"], [["client", "=", clientId], ["request_status", "in", ["Draft", "Documents Pending", "Under Review", "Payment Pending"]]]),
          fetchList("DigiVault Project", ["name"], [["client", "=", clientId]]),
          fetchList("DigiVault Client Document", ["name", "document_title", "document_date", "document_status"], [["client", "=", clientId]], 10, "creation desc"),
          fetchList("DigiVault GAP Analysis", ["name", "gap_status"], [["client", "=", clientId]], 1, "creation desc"),
        ]);
        if (compRes.status === "fulfilled") setCompleted(compRes.value?.length ?? 0);
        if (onRes.status === "fulfilled") setOngoing(onRes.value?.length ?? 0);
        if (penRes.status === "fulfilled") setPending(penRes.value?.length ?? 0);
        if (projRes.status === "fulfilled") setProjects(projRes.value?.length ?? 0);
        if (actRes.status === "fulfilled" && actRes.value?.length) setActivity(actRes.value);
        if (gapRes.status === "fulfilled" && gapRes.value?.length) {
          const g = gapRes.value[0];
          setGapStatus(g.gap_status || "");
          if (g.gap_status === "Pending" || g.gap_status === "Rejected") {
            try {
              const full = await fetchOne("DigiVault GAP Analysis", g.name);
              const issues = (full?.gap_files || []).filter(
                (f: any) => f.file_status === "Missing" || f.file_status === "Rejected"
              ).length;
              setGapIssueCount(issues);
            } catch { /* silent */ }
          }
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clientId]);

  const fmtDate = (d: string) => {
    try {
      return format(parseISO(d), "dd MMM yyyy");
    } catch {
      return d;
    }
  };

  const Badge = ({ status }: { status: string }) => {
    const s = statusStyles[status] ?? statusStyles.Pending;
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${s.bg} ${s.text}`}>
        {status}
      </span>
    );
  };

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
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-muted-foreground" />
            )}
          </span>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* ── Status ── */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Status</span>
          </div>
          <div className="h-px bg-border mb-3" />

          <div className="grid grid-cols-3 gap-3">
            {/* Completed */}
            <div className="rounded-xl p-3 flex flex-col items-center justify-center min-h-[80px] bg-[hsl(142_76%_90%)]">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={16} className="text-[hsl(142_76%_36%)]" />
                <span className="text-2xl font-bold text-[hsl(142_76%_36%)]">{completed}</span>
              </div>
              <span className="text-xs font-medium text-[hsl(142_76%_36%)] mt-1">Completed</span>
            </div>
            {/* Ongoing */}
            <div className="rounded-xl p-3 flex flex-col items-center justify-center min-h-[80px] bg-[hsl(217_91%_93%)]">
              <div className="flex items-center gap-1.5">
                <Hourglass size={16} className="text-[hsl(224_76%_48%)]" />
                <span className="text-2xl font-bold text-[hsl(224_76%_48%)]">{ongoing}</span>
              </div>
              <span className="text-xs font-medium text-[hsl(224_76%_48%)] mt-1">Ongoing</span>
            </div>
            {/* Pending */}
            <div className="rounded-xl p-3 flex flex-col items-center justify-center min-h-[80px] bg-[hsl(48_96%_89%)]">
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-[hsl(21_90%_48%)]" />
                <span className="text-2xl font-bold text-[hsl(21_90%_48%)]">{pending}</span>
              </div>
              <span className="text-xs font-medium text-[hsl(21_90%_48%)] mt-1">Pending</span>
            </div>
          </div>
        </section>

        {/* ── Projects banner ── */}
        <section>
          <button
            onClick={() => navigate("/select-project")}
            className="w-full rounded-xl px-4 py-3 flex items-center justify-between bg-[hsl(270_82%_94%)] hover:bg-[hsl(270_82%_90%)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-background flex items-center justify-center">
                <Landmark size={18} className="text-[hsl(263_70%_50%)]" />
              </span>
              <span className="text-sm font-bold text-[hsl(263_70%_50%)]">Projects</span>
            </div>
            <span className="text-2xl font-bold text-[hsl(263_70%_50%)]">{projects}</span>
          </button>
        </section>
        {/* ── GAP Alert ── */}
        {(gapStatus === "Pending" || gapStatus === "Rejected") && (
          <section>
            <button
              onClick={() => navigate("/gap-documents")}
              className={`w-full rounded-xl px-4 py-3 flex items-center gap-3 ${
                gapStatus === "Rejected"
                  ? "bg-[hsl(0_93%_94%)]"
                  : "bg-[hsl(48_96%_89%)]"
              }`}
            >
              <AlertTriangle
                size={20}
                className={gapStatus === "Rejected" ? "text-[hsl(0_72%_51%)]" : "text-[hsl(38_92%_50%)]"}
              />
              <span
                className={`flex-1 text-left text-sm font-medium ${
                  gapStatus === "Rejected" ? "text-[hsl(0_72%_51%)]" : "text-[hsl(38_92%_50%)]"
                }`}
              >
                {gapStatus === "Rejected"
                  ? "Documents need re-upload"
                  : "Documents under review"}
              </span>
              {gapIssueCount > 0 && (
                <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                  {gapIssueCount}
                </span>
              )}
            </button>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3">
          {[
            { label: "Orders", path: "/orders" },
            { label: "Payments", path: "/payments" },
            { label: "Proposals", path: "/proposals" },
            { label: "Estimate", path: "/estimates" },
            { label: "Invoice", path: "/invoices" },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => navigate(btn.path)}
              className="flex items-center justify-center gap-1.5 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              <FileText size={14} />
              {btn.label}
            </button>
          ))}
        </section>

        {/* ── All Activity ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={16} className={`text-primary ${loading ? "animate-spin" : ""}`} />
            <span className="text-sm font-semibold text-foreground">All Activity</span>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            {/* header row */}
            <div className="grid grid-cols-[1fr_90px_90px] bg-secondary px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground">Document Title</span>
              <span className="text-xs font-semibold text-muted-foreground text-center">Date</span>
              <span className="text-xs font-semibold text-muted-foreground text-center">Status</span>
            </div>

            {activity.map((item, i) => (
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
