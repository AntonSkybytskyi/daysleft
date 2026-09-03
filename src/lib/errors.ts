export type ErrorBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export function errorBody(code: string, message: string, details?: Record<string, unknown>): ErrorBody {
  return details ? { code, message, details } : { code, message };
}
