"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  supportedLocales,
  defaultLocale,
  isRtl,
  type LocaleCode,
} from "@/locales";
import { createTranslator } from "@/lib/i18n";

type LocaleContextValue = {
  locale: LocaleCode;
  t: (path: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: LocaleCode) => void;
  dir: "ltr" | "rtl";
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const COOKIE_NAME = "locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(`(?:^|;\\s*)${name}=([^;]*)`);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: LocaleCode;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<LocaleCode>(initialLocale);

  const setLocale = useCallback((newLocale: LocaleCode) => {
    setLocaleState(newLocale);
    setCookie(COOKIE_NAME, newLocale, COOKIE_MAX_AGE);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = isRtl(newLocale) ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
  }, [locale]);

  const { t } = createTranslator(locale);
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale, dir }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    const { t } = createTranslator(defaultLocale);
    return { locale: defaultLocale, t, setLocale: () => {}, dir: "ltr" };
  }
  return ctx;
}
