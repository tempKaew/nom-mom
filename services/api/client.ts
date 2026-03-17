import { getBaseUrl } from "@/utils/url";

export function authHeaders(idToken: string | null): HeadersInit {
  if (!idToken) return {};
  return { Authorization: `Bearer ${idToken}` };
}

export async function apiGet<T>(
  path: string,
  idToken: string | null
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    headers: authHeaders(idToken),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: (json as { error?: string })?.error ?? `Request failed (${res.status})`,
      status: res.status,
    };
  }
  return { ok: true, data: json as T };
}

export async function apiPost<T>(
  path: string,
  idToken: string | null,
  body: unknown
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(idToken),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: (json as { error?: string })?.error ?? `Request failed (${res.status})`,
      status: res.status,
    };
  }
  return { ok: true, data: json as T };
}

export async function apiDelete<T>(
  path: string,
  idToken: string | null
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "DELETE",
    headers: authHeaders(idToken),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: (json as { error?: string })?.error ?? `Request failed (${res.status})`,
      status: res.status,
    };
  }
  return { ok: true, data: json as T };
}

export async function apiPut<T>(
  path: string,
  idToken: string | null,
  body: unknown
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(idToken),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: (json as { error?: string })?.error ?? `Request failed (${res.status})`,
      status: res.status,
    };
  }
  return { ok: true, data: json as T };
}

export async function apiPatch<T>(
  path: string,
  idToken: string | null,
  body: unknown
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(idToken),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: (json as { error?: string })?.error ?? `Request failed (${res.status})`,
      status: res.status,
    };
  }
  return { ok: true, data: json as T };
}
