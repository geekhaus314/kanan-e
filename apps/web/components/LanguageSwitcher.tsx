"use client";

import { useLocale } from "./LocaleProvider";

const labels: Record<string, string> = {
  en: "EN",
  ar: "عر",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const toggle = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    setLocale(newLocale);
    // Reload so server components re-render with the new locale cookie
    window.location.reload();
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-gray-500 transition-colors hover:border-brand-500/30 hover:bg-brand-500/5 hover:text-brand-600"
      title={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      <span>{labels[locale === "en" ? "ar" : "en"]}</span>
    </button>
  );
}
