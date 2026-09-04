export type AccountLinkingInput = {
  clerkUserId: string;
  verifiedEmail: string | null;
};

export type ExistingAccountByEmail = { id: string; email: string } | null;

export type AccountLinkingDecision =
  | { kind: "rejected"; reason: "email_required" }
  | { kind: "upsert"; id: string; email: string };

export function resolveAccountLinking(
  input: AccountLinkingInput,
  existingAccountByEmail: ExistingAccountByEmail,
): AccountLinkingDecision {
  if (!input.verifiedEmail) {
    return { kind: "rejected", reason: "email_required" };
  }

  const id =
    existingAccountByEmail?.email === input.verifiedEmail
      ? existingAccountByEmail.id
      : input.clerkUserId;

  return { kind: "upsert", id, email: input.verifiedEmail };
}
