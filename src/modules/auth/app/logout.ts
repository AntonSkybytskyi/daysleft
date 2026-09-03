import { errorBody } from "@/lib/errors";

export type LogoutDeps = {
  getSessionId: () => Promise<string | null>;
  revokeSession: (sessionId: string) => Promise<void>;
};

export type LogoutResult = { status: 204 } | { status: 401; body: ReturnType<typeof errorBody> };

export async function logout(deps: LogoutDeps): Promise<LogoutResult> {
  const sessionId = await deps.getSessionId();
  if (!sessionId) {
    return { status: 401, body: errorBody("auth.session_invalid", "No active session.") };
  }

  await deps.revokeSession(sessionId);
  return { status: 204 };
}
