import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/contexts/AuthContext";
import { fetchList } from "@/lib/api";

interface ThreadSummary {
  service_request: string;
  last_message: string;
  last_sender: string;
  last_creation: string;
  unread: number;
}

const MessagesList = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.client_id) return;

    const load = async () => {
      try {
        // Fetch all messages for this client
        const msgs = await fetchList(
          "DigiVault Message",
          ["name", "service_request", "message_text", "sender_name", "sender_role", "is_read", "creation"],
          [["client", "=", auth.client_id]],
          500,
          "creation desc"
        );

        if (!msgs?.length) { setLoading(false); return; }

        // Group by service_request
        const grouped: Record<string, typeof msgs> = {};
        for (const m of msgs) {
          const sr = m.service_request;
          if (!grouped[sr]) grouped[sr] = [];
          grouped[sr].push(m);
        }

        const summaries: ThreadSummary[] = Object.entries(grouped).map(([sr, messages]) => {
          const latest = messages[0]; // already sorted desc
          const unread = messages.filter(
            (m: any) => !m.is_read && m.sender_role !== "Client"
          ).length;
          return {
            service_request: sr,
            last_message: latest.message_text || (latest.sender_role === "Client" ? "You sent an attachment" : "Attachment received"),
            last_sender: latest.sender_name || latest.sender_role,
            last_creation: latest.creation,
            unread,
          };
        });

        // Sort by latest message
        summaries.sort((a, b) => new Date(b.last_creation).getTime() - new Date(a.last_creation).getTime());
        setThreads(summaries);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [auth.client_id]);

  const fmtTime = (d: string) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      const now = new Date();
      const diff = now.getTime() - dt.getTime();
      if (diff < 86400000) {
        return dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      }
      if (diff < 604800000) {
        return dt.toLocaleDateString("en-IN", { weekday: "short" });
      }
      return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    } catch { return ""; }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Messages</h1>
      </div>

      <div className="px-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-16">Loading…</p>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <MessageSquare size={40} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {threads.map((t) => (
              <button
                key={t.service_request}
                onClick={() => navigate(`/messages/${encodeURIComponent(t.service_request)}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground truncate">{t.service_request}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{fmtTime(t.last_creation)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {t.last_sender}: {t.last_message}
                  </p>
                </div>
                {t.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {t.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomTabs />
    </div>
  );
};

export default MessagesList;
