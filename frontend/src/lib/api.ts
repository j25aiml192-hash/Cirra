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

  // In browser, use relative path so Next.js rewrites (/api/v1/:path*) proxy requests to FastAPI,
  // completely avoiding browser cross-origin (CORS) preflight blocks.
  const baseUrl =
    typeof window !== "undefined"
      ? ""
      : (process.env.NEXT_PUBLIC_API_URL || "");
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
    let errorData: any = null;
    const errorText = await res.text();
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }

    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;

      // Handle onboarding required
      if (
        (res.status === 403 && (errorData?.error === "onboarding_required" || errorData?.detail?.error === "onboarding_required")) ||
        errorData?.redirect === "/onboarding"
      ) {
        if (!currentPath.startsWith("/onboarding")) {
          window.location.href = "/onboarding";
        }
      }

      // Handle unauthorized
      if (res.status === 401 && !currentPath.startsWith("/login") && !currentPath.startsWith("/signup")) {
        useAuthStore.getState?.()?.logout?.();
        window.location.href = "/login";
      }
    }

    const message =
      errorData?.message ||
      errorData?.detail?.message ||
      errorData?.detail ||
      errorText ||
      `API request failed with status ${res.status}`;

    throw new ApiError(res.status, typeof message === "string" ? message : JSON.stringify(message), errorData);
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
