import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({ createDbClient: vi.fn().mockReturnValue({}) }));
vi.mock("@/modules/destinations/infra/destinations-deps", () => ({
  buildDestinationsDeps: vi.fn().mockReturnValue({
    getAuthUserId: async () => "user_1",
    repository: { listForOwner: vi.fn(), insert: vi.fn() },
  }),
}));

import { POST } from "./route";

function requestWithBody(json: () => Promise<unknown>) {
  return { json } as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/v1/destinations — boundary validation", () => {
  it("AC-02: returns the destinations.unsupported_reference refusal, never a 500, for a malformed JSON body", async () => {
    const request = requestWithBody(() => Promise.reject(new SyntaxError("Unexpected end of JSON input")));

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("destinations.unsupported_reference");
  });

  it("AC-02: returns the same refusal for a null body", async () => {
    const request = requestWithBody(() => Promise.resolve(null));

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("destinations.unsupported_reference");
  });
});
