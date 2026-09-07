import { auth } from "@clerk/nextjs/server";
import { TrackedDestinationsRepository } from "./tracked-destinations-repository";
import type { Db } from "@/db/client";

export type DestinationsDeps = {
  getAuthUserId: () => Promise<string | null>;
  repository: TrackedDestinationsRepository;
};

export function buildDestinationsDeps(db: Db): DestinationsDeps {
  return {
    getAuthUserId: async () => {
      const { userId } = await auth();
      return userId;
    },
    repository: new TrackedDestinationsRepository(db),
  };
}
