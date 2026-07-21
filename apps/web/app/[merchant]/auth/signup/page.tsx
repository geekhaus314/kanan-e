import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { SignUpForm } from "./client";

export default async function SignUpPage({
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-xl font-black text-gray-900">
            UD
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            Create Account
          </h1>
          <p className="mt-1 text-sm text-gray-500">{tenant.name}</p>
        </div>
        <SignUpForm merchant={merchant} />
      </div>
    </div>
  );
}
