import {
  locales,
  type LocaleCode,
  type TranslationDict,
  supportedLocales,
  defaultLocale,
} from "@/locales";

export function parseAcceptLanguage(header: string | null): LocaleCode {
  if (!header) return defaultLocale;

  const preferred = header
    .split(",")
    .map((s) => {
      const parts = s.trim().split(";q=");
      const langCode = (parts[0] ?? "").split("-")[0]?.toLowerCase() ?? "";
      const q = parseFloat(parts[1] ?? "1");
      return { lang: langCode, q };
    })
    .sort((a, b) => b.q - a.q);

  for (const p of preferred) {
    if ((supportedLocales as string[]).includes(p.lang)) {
      return p.lang as LocaleCode;
    }
  }

  return defaultLocale;
}

function resolveKey(
  obj: Record<string, unknown>,
  path: string
): string {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (
      current &&
      typeof current === "object" &&
      part in current
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }

  return typeof current === "string" ? current : path;
}

export function createTranslator(locale: LocaleCode) {
  const dict = locales[locale] as unknown as Record<string, unknown>;

  function t(path: string, vars?: Record<string, string | number>): string {
    let result = resolveKey(dict, path);

    if (vars) {
      for (const [key, value] of Object.entries(vars)) {
        result = result.replace(`{${key}}`, String(value));
      }
    }

    return result;
  }

  return { t, locale };
}

export async function getTranslations(): Promise<ReturnType<typeof createTranslator>> {
  const { cookies: getCookies, headers: getHeaders } = await import("next/headers");

  const headersList = await getHeaders();
  const pathname = headersList.get("x-pathname") ?? "";
  if (pathname.includes("/admin")) {
    return createTranslator("ar");
  }

  const cookieStore = await getCookies();
  const raw = cookieStore.get("locale")?.value;
  const locale = (raw && (supportedLocales as string[]).includes(raw)
    ? raw
    : defaultLocale) as LocaleCode;
  return createTranslator(locale);
}

export async function setAdminLocale(): Promise<void> {
  const { cookies: getCookies } = await import("next/headers");
  const cookieStore = await getCookies();
  cookieStore.set("locale", "ar", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export { supportedLocales, defaultLocale, type LocaleCode };
