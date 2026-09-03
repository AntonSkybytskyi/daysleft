import { describe, expect, it, vi } from "vitest";
import type { SessionDeps } from "@/modules/auth/app/session";
import { getDashboard } from "./get-dashboard";

describe("getDashboard", () => {
  it("returns 200 with has_trips:false for a valid session", async () => {
    const sessionDeps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue("user_1"),
      repository: {
        findById: vi.fn().mockResolvedValue({
          id: "user_1",
          email: "traveler@example.test",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as never,
      fetchClerkUser: vi.fn(),
    };

    const result = await getDashboard(sessionDeps);

    expect(result).toEqual({
      status: 200,
      body: { user: { id: "user_1", email: "traveler@example.test" }, has_trips: false, linked: false },
    });
  });

  it("returns 401 auth.session_invalid with details.return_to for the dashboard path when unauthenticated", async () => {
    const sessionDeps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue(null),
      repository: { findById: vi.fn() } as never,
      fetchClerkUser: vi.fn(),
    };

    const result = await getDashboard(sessionDeps);

    expect(result).toEqual({
      status: 401,
      body: {
        code: "auth.session_invalid",
        message: "Sign in to view your dashboard.",
        details: { return_to: "/dashboard" },
      },
    });
  });

  it("returns 401 auth.email_required when Clerk has no verified email for this session", async () => {
    const sessionDeps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue("user_1"),
      repository: { findById: vi.fn().mockResolvedValue(null) } as never,
      fetchClerkUser: vi.fn().mockResolvedValue({ id: "user_1", verifiedEmail: null }),
    };

    const result = await getDashboard(sessionDeps);

    expect(result).toEqual({
      status: 401,
      body: {
        code: "auth.email_required",
        message: "Add or verify an email address with your sign-in provider, then try again.",
        details: { return_to: "/dashboard" },
      },
    });
  });
});
