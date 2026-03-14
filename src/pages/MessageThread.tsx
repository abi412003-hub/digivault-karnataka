import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Paperclip,
  FileText,
} from "lucide-react";
import { fetchList, fetchOne, createRecord, uploadFile, updateRecord, getFileUrl } from "@/lib/api";
import { format } from "date-fns";

interface Message {
  name: string;
  service_request: string;
  project: string;
  client: string;
  sender_role: string;
  sender_name: string;
  sender_id: string;
  message_text: string;
  attachment: string;
  message_type: string;
  is_read: number;
  creation: string;
}

/* Role colors */
const bubbleStyles: Record<string, string> = {
  BD: "bg-[hsl(160_40%_93%)] text-foreground rounded-br-md",
  Client: "bg-[hsl(263_60%_95%)] text-foreground rounded-bl-md",
  "Delivery Partner": "bg-[hsl(14_70%_95%)] text-foreground rounded-bl-md",
};

const rolePill: Record<string, { bg: string; text: string; label: string }> = {
  Client: { bg: "bg-[hsl(263_70%_93%)]", text: "text-[hsl(263_70%_50%)]", label: "Client" },
  "Delivery Partner": { bg: "bg-[hsl(14_90%_93%)]", text: "text-[hsl(14_90%_48%)]", label: "DP" },
  BD: { bg: "bg-[hsl(160_60%_90%)]", text: "text-[hsl(160_60%_35%)]", label: "BD" },
};

const MessageThread = () => {
  const { serviceRequestId } = useParams<{ serviceRequestId: string }>();
  const navigate = useNavigate();

  /* BD identity */
  const bdUser = (() => {
    try { return JSON.parse(localStorage.getItem("edv_bd_user") || "null"); } catch { return null; }
  })();
  const bdName = bdUser?.full_name || bdUser?.bd_name || "BD";
  const bdId = bdUser?.name || bdUser?.bd_id || "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [srProject, setSrProject] = useState("");
  const [srClient, setSrClient] = useState("");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCreationRef = useRef("");
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  /* Load SR info */
  useEffect(() => {
    if (!serviceRequestId) return;
    fetchOne("DigiVault Service Request", serviceRequestId)
      .then((sr: any) => {
        if (sr) {
          setSrProject(sr.project || "");
          setSrClient(sr.client || "");
          setClientName(sr.client_name || sr.client || "");
        }
      })
      .catch(() => {});
  }, [serviceRequestId]);

  /* Fetch messages */
  const fetchMessages = useCallback(async (since?: string) => {
    if (!serviceRequestId) return;
    const filters: any[] = [["service_request", "=", serviceRequestId]];
    if (since) filters.push(["creation", ">", since]);

    try {
      const data = await fetchList(
        "DigiVault Message",
        ["name", "service_request", "project", "client", "sender_role", "sender_name", "sender_id", "message_text", "attachment", "message_type", "is_read", "creation"],
        filters, 200, "creation asc"
      );
      if (data?.length) {
        if (since) {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.name));
            const fresh = data.filter((m: Message) => !existing.has(m.name));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
        } else {
          setMessages(data);
        }
        lastCreationRef.current = data[data.length - 1].creation;
        scrollToBottom();

        /* Compute participants */
        const allMsgs = since ? [...messages, ...data] : data;
        const roles = [...new Set(allMsgs.map((m: Message) => m.sender_role))].filter(Boolean) as string[];
        setParticipants(roles);

        /* Mark non-BD messages as read */
        const unread = data.filter((m: Message) => !m.is_read && m.sender_role !== "BD");
        for (const m of unread) {
          updateRecord("DigiVault Message", m.name, { is_read: 1 }).catch(() => {});
        }
      }
    } catch {}
  }, [serviceRequestId, scrollToBottom, messages]);

  useEffect(() => { fetchMessages().then(() => setLoading(false)); }, [serviceRequestId]);
  useEffect(() => { if (!loading) scrollToBottom(); }, [loading, scrollToBottom]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (lastCreationRef.current) fetchMessages(lastCreationRef.current);
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  /* Send */
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !serviceRequestId) return;
    setSending(true);
    try {
      await createRecord("DigiVault Message", {
        service_request: serviceRequestId,
        project: srProject,
        client: srClient,
        sender_role: "BD",
        sender_name: bdName,
        sender_id: bdId,
        message_text: trimmed,
        message_type: "Text",
      });
      setText("");
      await fetchMessages(lastCreationRef.current || undefined);
    } catch {}
    setSending(false);
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !serviceRequestId) return;
    e.target.value = "";
    setSending(true);
    try {
      const uploadRes = await uploadFile(file, "DigiVault Message", "", "attachment");
      const fileUrl = uploadRes?.message?.file_url || "";
      await createRecord("DigiVault Message", {
        service_request: serviceRequestId,
        project: srProject,
        client: srClient,
        sender_role: "BD",
        sender_name: bdName,
        sender_id: bdId,
        message_text: "",
        message_type: file.type.startsWith("image/") ? "Image" : "Document",
        attachment: fileUrl,
      });
      await fetchMessages(lastCreationRef.current || undefined);
    } catch {}
    setSending(false);
  };

  const fmtTime = (d: string) => { try { return format(new Date(d), "hh:mm a"); } catch { return ""; } };
  const fmtDate = (d: string) => { try { return format(new Date(d), "dd MMM yyyy"); } catch { return ""; } };

  /* Group by date */
  const grouped: { date: string; msgs: Message[] }[] = [];
  let curDate = "";
  for (const m of messages) {
    const d = fmtDate(m.creation);
    if (d !== curDate) { curDate = d; grouped.push({ date: d, msgs: [] }); }
    grouped[grouped.length - 1].msgs.push(m);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background z-10 px-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/messages")} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">{clientName || serviceRequestId}</h1>
            <p className="text-xs text-muted-foreground truncate">{serviceRequestId}</p>
          </div>
        </div>
        {/* Participant badges */}
        {participants.length > 0 && (
          <div className="flex gap-1.5 mt-2 ml-12">
            {participants.map((role) => {
              const p = rolePill[role] || rolePill.BD;
              return (
                <span key={role} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.bg} ${p.text}`}>
                  {p.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-16">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">No messages yet. Start the conversation!</p>
        ) : (
          grouped.map((g) => (
            <div key={g.date}>
              <div className="flex justify-center my-3">
                <span className="text-[10px] text-muted-foreground bg-secondary px-3 py-1 rounded-full">{g.date}</span>
              </div>
              {g.msgs.map((m) => {
                if (m.message_type === "System") {
                  return (
                    <div key={m.name} className="flex justify-center my-2">
                      <p className="text-[11px] text-muted-foreground italic text-center max-w-[80%]">{m.message_text}</p>
                    </div>
                  );
                }

                const isBD = m.sender_role === "BD";
                const bubble = bubbleStyles[m.sender_role] || bubbleStyles.Client;
                const pill = rolePill[m.sender_role] || rolePill.Client;

                return (
                  <div key={m.name} className={`flex ${isBD ? "justify-end" : "justify-start"} mb-2`}>
                    <div className="max-w-[75%]">
                      <div className={`rounded-2xl px-3.5 py-2.5 ${bubble}`}>
                        {/* Attachment */}
                        {m.attachment && (
                          <div className="mb-1.5">
                            {m.message_type === "Image" ? (
                              <img
                                src={getFileUrl(m.attachment)}
                                alt="attachment"
                                className="rounded-lg max-h-48 object-cover cursor-pointer"
                                onClick={() => window.open(getFileUrl(m.attachment), "_blank")}
                              />
                            ) : (
                              <a href={getFileUrl(m.attachment)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg bg-background/60">
                                <FileText size={18} />
                                <span className="text-xs truncate">Document</span>
                              </a>
                            )}
                          </div>
                        )}
                        {m.message_text && <p className="text-sm leading-relaxed">{m.message_text}</p>}
                      </div>
                      <div className={`flex items-center gap-1.5 mt-0.5 flex-wrap ${isBD ? "justify-end" : "justify-start"}`}>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${pill.bg} ${pill.text}`}>{pill.label}</span>
                        <span className="text-[10px] text-muted-foreground">{m.sender_name}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{fmtTime(m.creation)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-background px-3 py-2.5 flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleAttach} />
        <button onClick={() => fileInputRef.current?.click()} disabled={sending}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 disabled:opacity-50">
          <Paperclip size={18} className="text-muted-foreground" />
        </button>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 h-10 rounded-full bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none"
        />
        <button onClick={handleSend} disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-50">
          <Send size={18} className="text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MessageThread;
