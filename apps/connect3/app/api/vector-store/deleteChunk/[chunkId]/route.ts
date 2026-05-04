import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth-middleware";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chunkId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { chunkId } = await params;

    if (!chunkId) {
      return NextResponse.json(
        { error: "Chunk ID is required" },
        { status: 400 }
      );
    }

    // Get the chunk from user_files to verify ownership
    const { data: chunk, error: fetchError } = await supabase
      .from("user_files")
      .select("user_id")
      .eq("id", chunkId)
      .single();

    if (fetchError || !chunk) {
      return NextResponse.json({ error: "Chunk not found" }, { status: 404 });
    }

    if (chunk.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this chunk" },
        { status: 403 }
      );
    }

    // Delete embeddings for this user from search_embeddings
    const { error: embeddingsError } = await supabase
      .from("search_embeddings")
      .delete()
      .eq("entity_id", user.id)
      .eq("entity_type", "profile");

    if (embeddingsError) {
      console.error("Failed to delete search embeddings:", embeddingsError);
    }

    // Delete from user_files table
    const { error: deleteError } = await supabase
      .from("user_files")
      .delete()
      .eq("id", chunkId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete chunk from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chunk:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}