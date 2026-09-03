import { getSessionUser, type SessionDeps } from "@/modules/auth/app/session";
import { errorBody } from "@/lib/errors";

export const DASHBOARD_PATH = "/dashboard";

export type DashboardResult =
  | { status: 200; body: { user: { id: string; email: string }; has_trips: false } }
  | { status: 401; body: ReturnType<typeof errorBody> };

export async function getDashboard(sessionDeps: SessionDeps): Promise<DashboardResult> {
  const session = await getSessionUser(sessionDeps);

  if (!session.authenticated) {
    return {
      status: 401,
      body: errorBody("auth.session_invalid", "Sign in to view your dashboard.", {
        return_to: DASHBOARD_PATH,
      }),
    };
  }

  return {
    status: 200,
    body: {
      user: { id: session.user.id, email: session.user.email },
      has_trips: false,
    },
  };
}
