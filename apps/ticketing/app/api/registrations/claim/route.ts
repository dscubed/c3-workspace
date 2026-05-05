import { NextRequest, NextResponse } from "next/server";
import { claimGuestRegistrations } from "@/app/actions/claimGuestRegistrations";

/**
 * POST /api/registrations/claim
 *
 * Claims all guest registrations (user_id = null) that match the given email,
 * linking them to the authenticated user.
 *
 * Called by connect3 after a user signs up or logs in via SSO.
 *
 * Body: { userId: string; email: string; secret: string }
 *
 * Protected by a shared CLAIM_SECRET env var to prevent arbitrary callers
 * from re-assigning registrations.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email, secret } = await request.json();

    if (!process.env.CLAIM_SECRET || secret !== process.env.CLAIM_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const claimed = await claimGuestRegistrations(userId, email);
    return NextResponse.json({ claimed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
