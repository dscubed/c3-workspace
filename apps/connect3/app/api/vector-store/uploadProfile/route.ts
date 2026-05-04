import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth-middleware";
import { embedProfile } from "@c3/search";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export const config = {
  runtime: "edge",
};

export async function POST(request: NextRequest) {
  try {
    // Authenticate user via Supabase Auth
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    const { user } = authResult;
    const { userId } = await request.json();

    // Validate input
    if (!userId || !user) {
      return NextResponse.json(
        { error: "userId, or authentication required" },
        { status: 400 },
      );
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Check if a profile upload is already in progress
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("is_processing_upload")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 },
      );
    }

    if (profile?.is_processing_upload) {
      return NextResponse.json(
        { error: "Profile upload already in progress" },
        { status: 409 },
      );
    }

    // Set the processing flag
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_processing_upload: true })
      .eq("id", userId);

    if (updateError) {
      console.error("Error setting processing flag:", updateError);
      return NextResponse.json(
        { error: "Failed to start profile upload" },
        { status: 500 },
      );
    }

    try {
      // Embed profile into pgvector search_embeddings table
      const result = await embedProfile(
        supabase,
        process.env.OPENAI_API_KEY!,
        userId,
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Clear processing flag
      await supabase
        .from("profiles")
        .update({ is_processing_upload: false })
        .eq("id", userId);

      return NextResponse.json(
        { message: "Profile embedded successfully", chunks: result.upserted },
        { status: 200 },
      );
    } catch (uploadError) {
      console.error("Error embedding profile:", uploadError);

      // Reset the processing flag on error
      await supabase
        .from("profiles")
        .update({ is_processing_upload: false })
        .eq("id", userId);

      return NextResponse.json(
        {
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to embed profile",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("❌ Error in uploadProfile route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
