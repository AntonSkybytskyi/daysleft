import { describe, expect, it } from "vitest";
import { AppError, errorBody, mapUnknownError, toErrorEnvelope } from "./errors";

describe("toErrorEnvelope", () => {
  it("wraps an error body in the unified { error: {...} } envelope", () => {
    expect(toErrorEnvelope(errorBody("auth.session_invalid", "Sign in."))).toEqual({
      error: { code: "auth.session_invalid", message: "Sign in." },
    });
  });
});

describe("AppError", () => {
  it("carries a code, message, status and optional details", () => {
    const err = new AppError("auth.session_invalid", "Sign in.", 401, { return_to: "/dashboard" });

    expect(err.code).toBe("auth.session_invalid");
    expect(err.message).toBe("Sign in.");
    expect(err.status).toBe(401);
    expect(err.toBody()).toEqual({
      code: "auth.session_invalid",
      message: "Sign in.",
      details: { return_to: "/dashboard" },
    });
  });
});

describe("mapUnknownError", () => {
  it("maps a thrown AppError to its own status and envelope", () => {
    const result = mapUnknownError(new AppError("auth.webhook_invalid_signature", "Bad signature.", 401));

    expect(result).toEqual({
      status: 401,
      body: { error: { code: "auth.webhook_invalid_signature", message: "Bad signature." } },
    });
  });

  it("maps any other thrown value to a 500 in the envelope, without leaking internals", () => {
    const result = mapUnknownError(new TypeError("Cannot read properties of undefined"));

    expect(result).toEqual({
      status: 500,
      body: { error: { code: "internal.unexpected", message: "Something went wrong." } },
    });
  });
});
