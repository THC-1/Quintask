export const API_BASE = "/api";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      "INVALID_RESPONSE",
      response.ok ? "服务器返回了无法解析的数据" : "请求失败，且服务器返回了无法解析的错误"
    );
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem("quintask_token");

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  const body = await readJson(response);

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    throw new ApiError(
      errorBody?.error?.code ?? `HTTP_${response.status}`,
      errorBody?.error?.message ?? "请求失败，请稍后重试"
    );
  }

  if (body === null) {
    return undefined as T;
  }

  return (body as { data: T }).data;
}
