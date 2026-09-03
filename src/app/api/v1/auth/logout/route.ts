import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getClerkClient } from "@/modules/auth/infra/clerk-client";
import { logout } from "@/modules/auth/app/logout";

export async function POST() {
  const result = await logout({
    getSessionId: async () => {
      const { sessionId } = await auth();
      return sessionId;
    },
    revokeSession: async (sessionId: string) => {
      await getClerkClient().sessions.revokeSession(sessionId);
    },
  });

  if (result.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(result.body, { status: result.status });
}
