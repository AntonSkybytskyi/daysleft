import { DASHBOARD_PATH } from "./get-dashboard";

export function resolveReturnTo(rawReturnTo: string | null, requestOrigin: string): string {
  if (!rawReturnTo) {
    return DASHBOARD_PATH;
  }

  let resolved: URL;
  try {
    resolved = new URL(rawReturnTo, requestOrigin);
  } catch {
    return DASHBOARD_PATH;
  }

  if (resolved.origin !== new URL(requestOrigin).origin) {
    return DASHBOARD_PATH;
  }

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

export function resolveLoginReturnTo(
  rawReturnTo: string | null,
  host: string | null,
  proto: string | null,
): string {
  const origin = `${proto ?? "https"}://${host ?? "localhost"}`;
  return resolveReturnTo(rawReturnTo, origin);
}
