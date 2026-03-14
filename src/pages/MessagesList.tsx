import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import BottomTabs from "@/components/BottomTabs";
import { fetchList } from "@/lib/api";

type Tab = "All" | "Clients" | "DPs";

interface ThreadSummary {
  service_request: string;
  client: string;
  last_message: string;
  last_sender: string;
  last_sender_role: string;
  last_creation: string;
  unread: number;
  hasClient: boolean;
  hasDP: boolean;
}

const roleBadge: Record<string, { bg: string; text: string; label: string }> = {
  Client: { bg: "bg-[hsl(263_70%_93%)]", text: "text-[hsl(263_70%_50%)]", label: "Client" },
  "Delivery Partner": { bg: "bg-[hsl(14_90%_93%)]", text: "text-[hsl(14_90%_48%)]", label: "DP" },
  BD: { bg: "bg-[hsl(160_60%_90%)]", text: "text-[hsl(160_60%_35%)]", label: "BD" },
};

const MessagesList = () => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All");

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  useEffect(() => {
    const load = async () => {
      try {
        const msgs = await fetchList(
          "DigiVault Message",
          ["name", "service_request", "client", "message_text", "sender_name", "sender_role", "is_read", "creation"],
          [],
          500,
          "creation desc"
        );
        if (!msgs?.length) { setLoading(false); return; }

        const grouped: Record<string, typeof msgs> = {};
        for (const m of msgs) {
          const sr = m.service_request;
          if (!grouped[sr]) grouped[sr] = [];
          grouped[sr].push(m);
        }

        const summaries: ThreadSummary[] = Object.entries(grouped).map(([sr, messages]) => {
          const latest = messages[0];
          const unread = messages.filter((m: any) => !m.is_read && m.sender_role !== "BD").length;
          const roles = new Set(messages.map((m: any) => m.sender_role));
          return {
            service_request: sr,
            client: latest.client || "",
            last_message: latest.message_text || "Attachment",
            last_sender: latest.sender_name || latest.sender_role,
            last_sender_role: latest.sender_role,
            last_creation: latest.creation,
            unread,
            hasClient: roles.has("Client"),
            hasDP: roles.has("Delivery Partner"),
          };
        });

        summaries.sort((a, b) => new Date(b.last_creation).getTime() - new Date(a.last_creation).getTime());
        setThreads(summaries);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const fmtTime = (d: string) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      const diff = Date.now() - dt.getTime();
      if (diff < 86400000) return dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      if (diff < 604800000) return dt.toLocaleDateString("en-IN", { weekday: "short" });
      return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    } catch { return ""; }
  };

  const filtered = threads.filter((t) => {
    if (tab === "Clients") return t.hasClient;
    if (tab === "DPs") return t.hasDP;
    return true;
  });

  const tabs: Tab[] = ["All", "Clients", "DPs"];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3">
        <h1 className="text-lg font-bold text-foreground">Messages</h1>
        {totalUnread > 0 && (
          <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pb-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-16">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <MessageSquare size={40} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No conversations</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((t) => {
              const badge = roleBadge[t.last_sender_role] || roleBadge.Client;
              return (
                <button
                  key={t.service_request}
                  onClick={() => navigate(`/messages/${encodeURIComponent(t.service_request)}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{t.service_request}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{fmtTime(t.last_creation)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.client}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {t.last_message.slice(0, 50)}{t.last_message.length > 50 ? "…" : ""}
                      </span>
                    </div>
                  </div>
                  {t.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {t.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomTabs />
    </div>
  );
};

export default MessagesList;
