import { auth } from "@clerk/nextjs/server";
import { getClerkClient } from "./clerk-client";
import { UsersRepository } from "./users-repository";
import type { Db } from "@/db/client";
import type { SessionDeps } from "../app/session";

export function buildSessionDeps(db: Db): SessionDeps {
  return {
    getAuthUserId: async () => {
      const { userId } = await auth();
      return userId;
    },
    repository: new UsersRepository(db),
    fetchClerkUser: async (userId: string) => {
      const client = getClerkClient();
      const clerkUser = await client.users.getUser(userId);
      const verified = clerkUser.emailAddresses.find(
        (entry) => entry.verification?.status === "verified" && entry.id === clerkUser.primaryEmailAddressId,
      );
      return { id: clerkUser.id, verifiedEmail: verified?.emailAddress ?? null };
    },
  };
}
