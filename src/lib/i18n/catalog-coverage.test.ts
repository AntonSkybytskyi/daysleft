import { describe, expect, it } from "vitest";
import en from "./en.json";
import { stringKeys as loginKeys } from "@/app/login/strings";
import { stringKeys as checkEmailKeys } from "@/app/check-email/strings";
import { stringKeys as ssoCallbackKeys } from "@/app/sso-callback/strings";
import { stringKeys as dashboardKeys } from "@/app/dashboard/strings";

describe("i18n catalog coverage", () => {
  it("every en.json key is referenced by at least one page's stringKeys (no dead, hardcoded-English screen)", () => {
    const referenced = new Set<string>([...loginKeys, ...checkEmailKeys, ...ssoCallbackKeys, ...dashboardKeys]);
    const unreferenced = Object.keys(en).filter((key) => !referenced.has(key));

    expect(unreferenced).toEqual([]);
  });
});
