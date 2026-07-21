"use client";

import { useLocale } from "./LocaleProvider";

const labels: Record<string, string> = {
  en: "EN",
  ar: "AR",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const toggle = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
      title={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      <span>{labels[locale === "en" ? "ar" : "en"]}</span>
    </button>
  );
}
