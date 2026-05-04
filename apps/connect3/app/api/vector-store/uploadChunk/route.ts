import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth-middleware";
import { embedProfile } from "@c3/search";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export const config = {
  runtime: "edge",
};

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const { userId } = await request.json();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "userId or authentication required" },
        { status: 400 }
      );
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    const result = await embedProfile(
      supabase,
      process.env.OPENAI_API_KEY!,
      userId,
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, chunks: result.upserted });
  } catch (error) {
    console.error("Error in uploadChunk route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}