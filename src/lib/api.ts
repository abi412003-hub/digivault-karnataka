const BASE_URL = "https://xorgsduvbpaokegawhbd.supabase.co/functions/v1/erpnext-proxy";

export async function fetchList(
  doctype: string,
  fields: string[],
  filters?: unknown[],
  limit?: number,
  orderBy?: string
) {
  const params = new URLSearchParams();
  params.set("path", "/api/resource/" + doctype);
  params.set("fields", JSON.stringify(fields));
  if (filters) params.set("filters", JSON.stringify(filters));
  if (limit) params.set("limit_page_length", String(limit));
  if (orderBy) params.set("order_by", orderBy);
  const res = await fetch(BASE_URL + "?" + params);
  const data = await res.json();
  return data.data;
}

export async function fetchOne(doctype: string, name: string) {
  const res = await fetch(
    BASE_URL + "?path=/api/resource/" + doctype + "/" + encodeURIComponent(name)
  );
  return (await res.json()).data;
}

export async function createRecord(doctype: string, body: Record<string, unknown>) {
  const res = await fetch(BASE_URL + "?path=/api/resource/" + doctype, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function updateRecord(doctype: string, name: string, body: Record<string, unknown>) {
  const res = await fetch(
    BASE_URL + "?path=/api/resource/" + doctype + "/" + encodeURIComponent(name),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return res.json();
}
