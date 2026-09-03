export function resolveReturnTo(rawReturnTo: string | null, requestOrigin: string, defaultPath: string): string {
  if (!rawReturnTo) {
    return defaultPath;
  }

  let resolved: URL;
  try {
    resolved = new URL(rawReturnTo, requestOrigin);
  } catch {
    return defaultPath;
  }

  if (resolved.origin !== new URL(requestOrigin).origin) {
    return defaultPath;
  }

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

export function resolveLoginReturnTo(
  rawReturnTo: string | null,
  host: string | null,
  proto: string | null,
  defaultPath: string,
): string {
  const origin = `${proto ?? "https"}://${host ?? "localhost"}`;
  return resolveReturnTo(rawReturnTo, origin, defaultPath);
}
