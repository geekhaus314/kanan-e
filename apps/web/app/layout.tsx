import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "@/styles/globals.css";
import { LocaleProvider } from "@/components/LocaleProvider";
import {
  supportedLocales,
  defaultLocale,
  isRtl,
  type LocaleCode,
} from "@/locales";

export const metadata: Metadata = {
  title: "KananOS — Multi-Tenant Commerce Platform",
  description: "Enterprise ecommerce platform powered by Kanan Enterprises LLC",
};

function parseAcceptLanguage(header: string | null): LocaleCode {
  if (!header) return defaultLocale;
  for (const part of header.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const lang = trimmed.split(";q=")[0];
    if (!lang) continue;
    const code = lang.split("-")[0]?.toLowerCase() ?? "";
    if ((supportedLocales as string[]).includes(code)) {
      return code as LocaleCode;
    }
  }
  return defaultLocale;
}

async function detectLocale(): Promise<LocaleCode> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-middleware-path") ?? "";
  const isAdminPath = pathname.includes("/admin");

  const cookieStore = await cookies();
  const cookieVal = cookieStore.get("locale")?.value as LocaleCode | undefined;

  if (isAdminPath) {
    return "ar";
  }

  if (cookieVal && (supportedLocales as string[]).includes(cookieVal)) {
    return cookieVal;
  }

  const acceptLang = headersList.get("Accept-Language") ?? headersList.get("accept-language");
  return parseAcceptLanguage(acceptLang);
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await detectLocale();
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <LocaleProvider initialLocale={locale}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
