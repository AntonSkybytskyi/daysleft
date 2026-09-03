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

  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;

  // A same-origin check on `resolved.origin` isn't enough on its own: dot-segment normalisation
  // (e.g. "/..//evil.example/x") can produce a pathname starting with "//", which a browser
  // treats as a protocol-relative URL and resolves off-origin regardless of this app's own origin.
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return defaultPath;
  }

  return path;
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
