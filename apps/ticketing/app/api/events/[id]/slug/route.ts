import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { checkEventPermission } from "@/lib/auth/clubAdmin";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "Missing slug parameter" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("url_slug", slug)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking slug:", error);
    return NextResponse.json(
      { error: "Failed to check slug availability" },
      { status: 500 },
    );
  }

  const isAvailable = !data || data.id === eventId;

  return NextResponse.json({ available: isAvailable });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const perm = await checkEventPermission(eventId, user.id);
  if (!perm.isCreator && !perm.isCollaborator && !perm.isClubAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slug } = body;

  if (slug === undefined) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  if (slug) {
    const { data: existing, error: checkErr } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("url_slug", slug)
      .single();

    if (checkErr && checkErr.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to check slug availability" },
        { status: 500 },
      );
    }

    if (existing && existing.id !== eventId) {
      return NextResponse.json(
        { error: "Slug is already taken" },
        { status: 409 },
      );
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from("events")
    .update({ url_slug: slug || null })
    .eq("id", eventId);

  if (updateError) {
    console.error("Failed to update slug:", updateError);
    return NextResponse.json(
      { error: "Failed to update slug" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, slug });
}
