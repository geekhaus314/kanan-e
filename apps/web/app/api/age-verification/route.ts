import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initiateVerification } from "@/lib/age-verification";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await initiateVerification({
      userId: Number(session.user.id),
      fullName: body.fullName,
      dateOfBirth: body.dateOfBirth,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    );
  }
}
