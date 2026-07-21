import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { approveVerification, rejectVerification } from "@/lib/age-verification";
import { db, schema } from "@kananos/database";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json(
      { error: "System unavailable" },
      { status: 503 }
    );
  }

  const adminId = Number(session.user.id);

  const isAdmin = await db
    .select()
    .from(schema.tenantUsers)
    .where(
      eq(schema.tenantUsers.userId, adminId)
    )
    .limit(1)
    .then((r) => r[0]?.role === "admin");

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { verificationId, action, reason } = body;

    if (!verificationId || !action) {
      return NextResponse.json(
        { error: "verificationId and action are required" },
        { status: 400 }
      );
    }

    let result;
    if (action === "approve") {
      result = await approveVerification(verificationId, adminId);
    } else if (action === "reject") {
      result = await rejectVerification(verificationId, adminId, reason);
    } else {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, verification: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json(
      { error: "System unavailable" },
      { status: 503 }
    );
  }

  const adminId = Number(session.user.id);

  const isAdmin = await db
    .select()
    .from(schema.tenantUsers)
    .where(
      eq(schema.tenantUsers.userId, adminId)
    )
    .limit(1)
    .then((r) => r[0]?.role === "admin");

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { getPendingVerifications } = await import("@/lib/age-verification");
  const pending = await getPendingVerifications(1);
  return NextResponse.json(pending);
}
