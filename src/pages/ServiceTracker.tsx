import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Phone, MapPin, MessageSquare } from "lucide-react";
import { fetchOne, fetchList } from "@/lib/api";
import { format, parseISO, formatDistanceToNow } from "date-fns";

interface ProcessStep {
  step_name: string;
  step_status: string;
  step_date: string;
  step_remark: string;
}

interface Task {
  name: string;
  task_name: string;
  task_status: string;
  assigned_to: string;
  process_steps: ProcessStep[];
}

const ServiceTracker = () => {
  const { srId } = useParams<{ srId: string }>();
  const navigate = useNavigate();

  const [sr, setSr] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allSteps, setAllSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!srId) return;

    const load = async () => {
      try {
        const [srData, taskData] = await Promise.all([
          fetchOne("DigiVault Service Request", srId),
          fetchList(
            "DigiVault Task",
            ["name", "task_name", "task_status", "assigned_to"],
            [["service_request", "=", srId]]
          ),
        ]);

        if (srData) setSr(srData);

        if (taskData?.length) {
          // Fetch full task docs to get child table process_steps
          const fullTasks = await Promise.all(
            taskData.map((t: any) => fetchOne("DigiVault Task", t.name))
          );
          setTasks(fullTasks.filter(Boolean));

          // Flatten all process_steps
          const steps: ProcessStep[] = [];
          for (const t of fullTasks) {
            if (t?.process_steps?.length) {
              steps.push(...t.process_steps);
            }
          }
          setAllSteps(steps);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [srId]);

  const percentage = sr?.progress_percentage ?? 0;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const lastUpdated = allSteps
    .filter((s) => s.step_date)
    .sort((a, b) => new Date(b.step_date).getTime() - new Date(a.step_date).getTime())[0]?.step_date;

  const getStepColor = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s === "completed" || s === "done") return "completed";
    if (s === "in progress" || s === "ongoing" || s === "working") return "in_progress";
    return "pending";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground">Track Service</h1>
          <p className="text-xs text-muted-foreground truncate">{srId}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-16">Loading tracker…</p>
      ) : !sr ? (
        <p className="text-sm text-muted-foreground text-center py-16">Service request not found</p>
      ) : (
        <div className="px-4 space-y-6">
          {/* Progress Ring */}
          <div className="flex flex-col items-center">
            <div className="relative w-[120px] h-[120px]">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" className="stroke-muted" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="stroke-primary"
                  style={{ strokeDasharray: circumference, strokeDashoffset }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{Math.round(percentage)}%</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground mt-3">
              {sr.main_service || "Service"} — {sr.sub_service || ""}
            </p>
            {sr.assigned_dp && (
              <div className="flex items-center gap-2 mt-1.5">
                <MapPin size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{sr.assigned_dp}</span>
              </div>
            )}
          </div>

          {/* Step Timeline */}
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3">Progress Steps</h2>

            {allSteps.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No steps recorded yet</p>
            ) : (
              <div className="relative pl-6">
                {allSteps.map((step, i) => {
                  const state = getStepColor(step.step_status);
                  const isLast = i === allSteps.length - 1;

                  return (
                    <div key={i} className="relative pb-6 last:pb-0">
                      {/* Vertical line */}
                      {!isLast && (
                        <div
                          className={`absolute left-0 top-3 w-0.5 h-full ${
                            state === "completed" ? "bg-[hsl(var(--success))]" : "bg-muted"
                          }`}
                          style={{ transform: "translateX(-0.5px)" }}
                        />
                      )}

                      {/* Dot */}
                      <div className="absolute left-0 top-1 -translate-x-1/2">
                        {state === "completed" ? (
                          <CheckCircle2 size={18} className="text-[hsl(var(--success))] bg-background rounded-full" />
                        ) : state === "in_progress" ? (
                          <span className="block w-4 h-4 rounded-full border-[3px] border-primary bg-background animate-pulse" />
                        ) : (
                          <span className="block w-4 h-4 rounded-full border-2 border-muted-foreground/30 bg-background" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="ml-4">
                        <p className="text-sm font-medium text-foreground">{step.step_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {state === "completed" && step.step_date && (
                            <span className="text-xs text-muted-foreground">
                              {(() => { try { return format(parseISO(step.step_date), "dd MMM yyyy"); } catch { return step.step_date; } })()}
                            </span>
                          )}
                          {state === "in_progress" && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[hsl(var(--primary)/0.12)] text-primary">
                              In Progress
                            </span>
                          )}
                          {state === "pending" && (
                            <span className="text-xs text-muted-foreground/60">Pending</span>
                          )}
                        </div>
                        {step.step_remark && (
                          <p className="text-xs text-muted-foreground mt-0.5">{step.step_remark}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Bottom Card */}
          <section className="rounded-xl border border-border p-4 space-y-2.5 bg-card">
            {sr.progress_steps_total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Steps completed</span>
                <span className="font-semibold text-foreground">
                  {sr.progress_steps_completed ?? 0} / {sr.progress_steps_total}
                </span>
              </div>
            )}
            {lastUpdated && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last updated</span>
                <span className="font-semibold text-foreground">
                  {(() => { try { return formatDistanceToNow(parseISO(lastUpdated), { addSuffix: true }); } catch { return lastUpdated; } })()}
                </span>
              </div>
            )}
            <button
              onClick={() => {/* TODO: navigate to messaging */}}
              className="w-full mt-2 flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              <MessageSquare size={16} />
              Contact BD
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

export default ServiceTracker;
