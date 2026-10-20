import type { ApiError } from "@cirra/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiClientError extends Error {
  public status: number;
  public details?: Record<string, unknown>;

  constructor(status: number, errorData: ApiError) {
    super(errorData.message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = errorData.details;
  }
}

export interface RequestOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, params, headers, ...restOptions } = options;

  let url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined) {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  // In client/server context, attach Authorization token if available
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  });

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = (await response.json()) as ApiError;
    } catch {
      errorData = {
        code: "HTTP_ERROR",
        message: `Request failed with status ${response.status}: ${response.statusText}`,
      };
    }
    throw new ApiClientError(response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
