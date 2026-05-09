import { authenticateRequest } from "@/lib/api/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { embedEvent } from "@c3/search";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

interface RouteParameters {
  params: Promise<{ eventId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParameters) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { eventId } = await params;

    const result = await embedEvent(
      supabase,
      process.env.OPENAI_API_KEY!,
      eventId,
    );

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, chunks: result.upserted });
  } catch (error) {
    console.error("Upload process error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParameters) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { eventId } = await params;

    const { data: existingEvent, error: fetchError } = await supabase
      .from("event_summary")
      .select("creator_profile_id")
      .eq("id", eventId)
      .single();

    if (fetchError || !existingEvent) {
      return NextResponse.json(
        { error: fetchError?.message || "Event not found" },
        { status: fetchError ? 500 : 404 },
      );
    }

    if (existingEvent.creator_profile_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to edit this event" },
        { status: 403 },
      );
    }

    // Re-embed the event (upsert handles replacing existing chunks)
    const result = await embedEvent(
      supabase,
      process.env.OPENAI_API_KEY!,
      eventId,
    );

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, chunks: result.upserted });
  } catch (error) {
    console.error("Vector store update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParameters) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { eventId } = await params;

    const { data: existingEvent, error: fetchError } = await supabase
      .from("event_summary")
      .select("creator_profile_id")
      .eq("id", eventId)
      .single();

    if (fetchError || !existingEvent) {
      return NextResponse.json(
        { error: fetchError?.message || "Event not found" },
        { status: fetchError ? 500 : 404 },
      );
    }

    if (existingEvent.creator_profile_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this event" },
        { status: 403 },
      );
    }

    // Delete all search_embeddings for this event
    const { error: deleteError } = await supabase
      .from("search_embeddings")
      .delete()
      .eq("entity_id", eventId)
      .eq("entity_type", "event");

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vector store delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}