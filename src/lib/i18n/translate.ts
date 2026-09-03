import en from "./en.json";

type Catalog = Record<string, string>;

const catalogs: Record<string, Catalog> = { en };
const defaultLocale = "en";

export function resolveLocale(acceptLanguage?: string | null): string {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const preferred = acceptLanguage.split(",")[0]?.trim().split("-")[0]?.toLowerCase();
  return preferred && preferred in catalogs ? preferred : defaultLocale;
}

export function translate(key: string, acceptLanguage?: string | null): string {
  const catalog = catalogs[resolveLocale(acceptLanguage)] ?? catalogs[defaultLocale];
  return catalog[key] ?? key;
}

export function translateAll<K extends string>(
  keys: readonly K[],
  acceptLanguage?: string | null,
): Record<K, string> {
  return Object.fromEntries(keys.map((key) => [key, translate(key, acceptLanguage)])) as Record<K, string>;
}
