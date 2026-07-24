"use client";

import { useLocale } from "./LocaleProvider";

const labels: Record<string, string> = {
  en: "EN",
  ar: "عر",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const toggle = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-gray-400 transition-colors hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-400"
      title={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      <span>{labels[locale === "en" ? "ar" : "en"]}</span>
    </button>
  );
}
