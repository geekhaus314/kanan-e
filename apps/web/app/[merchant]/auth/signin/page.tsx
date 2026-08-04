import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { SignInForm } from "./client";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-xl font-black text-white">
            UD
          </div>
          <h1 className="text-2xl font-black text-gray-900">Sign In</h1>
          <p className="mt-1 text-sm text-gray-500">{tenant.name}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <SignInForm merchant={merchant} />
        </div>
      </div>
    </div>
  );
}
