import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVerificationStatus } from "@/lib/age-verification";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ verified: false, reason: "not_authenticated" });
  }

  const status = await getVerificationStatus(Number(session.user.id));
  return NextResponse.json(status);
}
