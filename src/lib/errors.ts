export type ErrorBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export function errorBody(code: string, message: string, details?: Record<string, unknown>): ErrorBody {
  return details ? { code, message, details } : { code, message };
}

export function toErrorEnvelope(body: ErrorBody): { error: ErrorBody } {
  return { error: body };
}

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  toBody(): ErrorBody {
    return errorBody(this.code, this.message, this.details);
  }
}

export function mapUnknownError(error: unknown): { status: number; body: { error: ErrorBody } } {
  if (error instanceof AppError) {
    return { status: error.status, body: toErrorEnvelope(error.toBody()) };
  }
  return {
    status: 500,
    body: toErrorEnvelope(errorBody("internal.unexpected", "Something went wrong.")),
  };
}
