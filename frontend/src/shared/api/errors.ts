export interface ApiErrorShape {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export class ApiError extends Error {
  code?: string;
  status?: number;
  details?: unknown;

  constructor(message: string, code?: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function extractMessage(data: unknown, fallback: string): string {
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data === "object" && data !== null) {
    const body = data as { message?: unknown; error?: unknown };
    if (Array.isArray(body.message)) {
      return body.message.filter((m) => typeof m === "string").join(" ");
    }
    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }
    if (typeof body.error === "string" && body.error.trim()) {
      return body.error;
    }
  }
  return fallback;
}

function extractCode(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null) {
    const code = (data as { code?: unknown }).code;
    if (typeof code === "string" && code.trim()) return code;
  }
  return undefined;
}

function extractDetails(data: unknown): unknown {
  if (typeof data === "object" && data !== null) {
    const details = (data as { details?: unknown }).details;
    if (details !== undefined) return details;
  }
  return undefined;
}

/** Normalizes axios/fetch errors into { message, code, status, details } for UI display. */
export function normalizeError(error: unknown, fallback = "Something went wrong. Please try again."): ApiErrorShape {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
    };
  }

  const axiosLike = error as {
    response?: { status?: number; data?: unknown };
    message?: string;
  };

  if (axiosLike?.response) {
    const { status, data } = axiosLike.response;
    return {
      message: extractMessage(data, fallback),
      code: extractCode(data),
      status,
      details: extractDetails(data),
    };
  }

  if (error instanceof Error && error.message) {
    return { message: error.message };
  }

  return { message: fallback };
}
