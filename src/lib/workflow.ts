const WORKFLOW_URL = "https://xorgsduvbpaokegawhbd.supabase.co/functions/v1/workflow-engine";

export interface TransitionResult {
  success: boolean;
  entity: string;
  name: string;
  previous_state: string;
  new_state: string;
  trigger: string;
  side_effects: string[];
  error?: string;
  valid_triggers?: string[];
}

export async function transition(
  entity: "project" | "service_request" | "document" | "payment",
  trigger: string,
  name: string,
  context?: Record<string, unknown>
): Promise<TransitionResult> {
  const res = await fetch(WORKFLOW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entity, trigger, name, context }),
  });
  return res.json();
}

// Convenience helpers
export const projectTransition = (trigger: string, name: string) =>
  transition("project", trigger, name);

export const srTransition = (trigger: string, name: string, context?: Record<string, unknown>) =>
  transition("service_request", trigger, name, context);

export const docTransition = (trigger: string, name: string) =>
  transition("document", trigger, name);

export const paymentTransition = (trigger: string, name: string, context?: Record<string, unknown>) =>
  transition("payment", trigger, name, context);
