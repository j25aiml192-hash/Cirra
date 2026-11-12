import { useAuthStore } from "@/store/authStore";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token =
    useAuthStore.getState?.()?.token ||
    (typeof window !== "undefined" ? localStorage.getItem("cirra_token") : null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = path.startsWith("http")
    ? path
    : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `API request failed with status ${res.status}`);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }

  return (await res.text()) as unknown as T;
}
