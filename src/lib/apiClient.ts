type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiJson<T>(
  url: string,
  options?: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    credentials?: RequestCredentials;
    signal?: AbortSignal;
    cache?: RequestCache;
  }
): Promise<T> {
  const method = options?.method ?? "GET";
  const headers: Record<string, string> = {
    ...(options?.headers ?? {}),
  };

  let body: BodyInit | undefined = undefined;
  if (options?.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: options?.credentials,
    signal: options?.signal,
    cache: options?.cache,
  });

  const payload = await safeJson(res);

  if (!res.ok) {
    const message =
      (payload as { error?: string } | null)?.error ??
      res.statusText ??
      "Request failed";
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}
