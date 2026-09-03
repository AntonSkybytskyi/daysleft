import { describe, expect, it, vi } from "vitest";
import { logout, type LogoutDeps } from "./logout";

describe("logout", () => {
  it("revokes the session server-side and returns 204 when a session is active", async () => {
    const revokeSession = vi.fn().mockResolvedValue(undefined);
    const deps: LogoutDeps = { getSessionId: vi.fn().mockResolvedValue("sess_1"), revokeSession };

    const result = await logout(deps);

    expect(result).toEqual({ status: 204 });
    expect(revokeSession).toHaveBeenCalledWith("sess_1");
  });

  it("returns 401 auth.session_invalid when there is no active session", async () => {
    const revokeSession = vi.fn();
    const deps: LogoutDeps = { getSessionId: vi.fn().mockResolvedValue(null), revokeSession };

    const result = await logout(deps);

    expect(result).toEqual({
      status: 401,
      body: { code: "auth.session_invalid", message: "No active session." },
    });
    expect(revokeSession).not.toHaveBeenCalled();
  });
});
