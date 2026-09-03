import { getSessionUser, type SessionDeps } from "@/modules/auth/app/session";
import { errorBody } from "@/lib/errors";

export const DASHBOARD_PATH = "/dashboard";

export type DashboardResult =
  | { status: 200; body: { user: { id: string; email: string }; has_trips: false; linked: boolean } }
  | { status: 401; body: ReturnType<typeof errorBody> };

export async function getDashboard(
  sessionDeps: SessionDeps,
  requestedPath: string = DASHBOARD_PATH,
): Promise<DashboardResult> {
  const session = await getSessionUser(sessionDeps);

  if (!session.authenticated) {
    if (session.reason === "email_required") {
      return {
        status: 401,
        body: errorBody(
          "auth.email_required",
          "Add or verify an email address with your sign-in provider, then try again.",
          { return_to: requestedPath },
        ),
      };
    }

    return {
      status: 401,
      body: errorBody("auth.session_invalid", "Sign in to view your dashboard.", {
        return_to: requestedPath,
      }),
    };
  }

  return {
    status: 200,
    body: {
      user: { id: session.user.id, email: session.user.email },
      has_trips: false,
      linked: session.linked ?? false,
    },
  };
}
