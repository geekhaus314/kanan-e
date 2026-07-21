import en from "./en.json";
import ar from "./ar.json";

export const locales = { en, ar } as const;
export type LocaleCode = keyof typeof locales;
export type TranslationDict = (typeof locales)["en"];

export const supportedLocales: LocaleCode[] = ["en", "ar"];
export const defaultLocale: LocaleCode = "en";
export const rtlLocales: LocaleCode[] = ["ar"];

export function isRtl(locale: LocaleCode): boolean {
  return rtlLocales.includes(locale);
}
