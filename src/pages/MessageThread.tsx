import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Paperclip,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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

const MessageThread = () => {
  const { serviceRequestId } = useParams<{ serviceRequestId: string }>();
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [srProject, setSrProject] = useState("");
  const [bdName, setBdName] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCreationRef = useRef("");
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  // Load SR info
  useEffect(() => {
    if (!serviceRequestId) return;
    fetchOne("DigiVault Service Request", serviceRequestId)
      .then((sr: any) => {
        if (sr) {
          setSrProject(sr.project || "");
          setBdName(sr.assigned_dp || "BD");
        }
      })
      .catch(() => {});
  }, [serviceRequestId]);

  // Fetch messages
  const fetchMessages = useCallback(async (since?: string) => {
    if (!serviceRequestId || !auth.client_id) return;

    const filters: any[] = [["service_request", "=", serviceRequestId]];
    if (since) {
      filters.push(["creation", ">", since]);
    }

    try {
      const data = await fetchList(
        "DigiVault Message",
        [
          "name", "service_request", "project", "client", "sender_role",
          "sender_name", "sender_id", "message_text", "attachment",
          "message_type", "is_read", "creation",
        ],
        filters,
        200,
        "creation asc"
      );

      if (data?.length) {
        if (since) {
          setMessages((prev) => {
            const existingNames = new Set(prev.map((m) => m.name));
            const newMsgs = data.filter((m: Message) => !existingNames.has(m.name));
            if (newMsgs.length === 0) return prev;
            return [...prev, ...newMsgs];
          });
        } else {
          setMessages(data);
        }
        lastCreationRef.current = data[data.length - 1].creation;
        scrollToBottom();

        // Mark unread BD/DP messages as read
        const unread = data.filter(
          (m: Message) => !m.is_read && m.sender_role !== "Client"
        );
        for (const m of unread) {
          updateRecord("DigiVault Message", m.name, { is_read: 1 }).catch(() => {});
        }
      }
    } catch {
      // silent
    }
  }, [serviceRequestId, auth.client_id, scrollToBottom]);

  // Initial load
  useEffect(() => {
    fetchMessages().then(() => setLoading(false));
  }, [fetchMessages]);

  // Scroll on initial load
  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [loading, scrollToBottom]);

  // Poll every 10s
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (lastCreationRef.current) {
        fetchMessages(lastCreationRef.current);
      }
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !serviceRequestId) return;

    setSending(true);
    try {
      await createRecord("DigiVault Message", {
        service_request: serviceRequestId,
        project: srProject,
        client: auth.client_id,
        sender_role: "Client",
        sender_name: auth.name || "Client",
        sender_id: auth.client_id,
        message_text: trimmed,
        message_type: "Text",
      });
      setText("");
      // Refresh messages
      await fetchMessages(lastCreationRef.current || undefined);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !serviceRequestId) return;
    e.target.value = "";

    setSending(true);
    try {
      const uploadRes = await uploadFile(file, "DigiVault Message", "", "attachment");
      const fileUrl = uploadRes?.message?.file_url || "";
      const isImage = file.type.startsWith("image/");

      await createRecord("DigiVault Message", {
        service_request: serviceRequestId,
        project: srProject,
        client: auth.client_id,
        sender_role: "Client",
        sender_name: auth.name || "Client",
        sender_id: auth.client_id,
        message_text: "",
        message_type: isImage ? "Image" : "Document",
        attachment: fileUrl,
      });

      await fetchMessages(lastCreationRef.current || undefined);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const fmtTime = (d: string) => {
    try { return format(new Date(d), "hh:mm a"); } catch { return ""; }
  };

  const fmtDate = (d: string) => {
    try { return format(new Date(d), "dd MMM yyyy"); } catch { return ""; }
  };

  // Group messages by date
  const groupedByDate: { date: string; msgs: Message[] }[] = [];
  let currentDate = "";
  for (const m of messages) {
    const d = fmtDate(m.creation);
    if (d !== currentDate) {
      currentDate = d;
      groupedByDate.push({ date: d, msgs: [] });
    }
    groupedByDate[groupedByDate.length - 1].msgs.push(m);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3 border-b border-border bg-background z-10">
        <button onClick={() => navigate("/messages")} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground truncate">{serviceRequestId}</h1>
          <p className="text-xs text-muted-foreground">{bdName}</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-16">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">No messages yet. Start the conversation!</p>
        ) : (
          groupedByDate.map((group) => (
            <div key={group.date}>
              <div className="flex justify-center my-3">
                <span className="text-[10px] text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  {group.date}
                </span>
              </div>
              {group.msgs.map((m) => {
                if (m.message_type === "System" || m.sender_role === "System") {
                  return (
                    <div key={m.name} className="flex justify-center my-2">
                      <p className="text-[11px] text-muted-foreground italic text-center max-w-[80%]">
                        {m.message_text}
                      </p>
                    </div>
                  );
                }

                const isClient = m.sender_role === "Client";

                return (
                  <div key={m.name} className={`flex ${isClient ? "justify-end" : "justify-start"} mb-2`}>
                    <div className={`max-w-[75%] ${isClient ? "order-1" : ""}`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 ${
                          isClient
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-foreground rounded-bl-md"
                        }`}
                      >
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
                              <a
                                href={getFileUrl(m.attachment)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-2 rounded-lg ${
                                  isClient ? "bg-white/10" : "bg-background"
                                }`}
                              >
                                <FileText size={18} />
                                <span className="text-xs truncate">Document</span>
                              </a>
                            )}
                          </div>
                        )}

                        {m.message_text && (
                          <p className="text-sm leading-relaxed">{m.message_text}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 mt-0.5 ${isClient ? "justify-end" : "justify-start"}`}>
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={handleAttach}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 disabled:opacity-50"
        >
          <Paperclip size={18} className="text-muted-foreground" />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 h-10 rounded-full bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-50"
        >
          <Send size={18} className="text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MessageThread;
