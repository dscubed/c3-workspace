import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { createClient } from "@c3/supabase/server";

async function isClubOwnerOrAdmin(
  clubId: string,
  userId: string,
): Promise<{ isOwner: boolean; isAdmin: boolean }> {
  const { data: club } = await supabaseAdmin
    .from("profiles")
    .select("id, account_type")
    .eq("id", clubId)
    .eq("account_type", "organisation")
    .single();

  if (!club) return { isOwner: false, isAdmin: false };

  const isOwner = clubId === userId;
  if (isOwner) return { isOwner: true, isAdmin: false };

  const { data: adminRow } = await supabaseAdmin
    .from("club_admins")
    .select("status, role")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  return { isOwner: false, isAdmin: !!adminRow };
}

/* GET /api/clubs/[id]/admins */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clubId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isOwner, isAdmin } = await isClubOwnerOrAdmin(clubId, user.id);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("club_admins")
      .select(
        `id, club_id, user_id, role, status, invited_by, created_at,
         profiles:user_id(id, first_name, last_name, avatar_url, account_type)`,
      )
      .eq("club_id", clubId)
      .in("status", ["pending", "accepted", "declined"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch club admins:", error);
      return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/clubs/[id]/admins error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* POST /api/clubs/[id]/admins — invite by email */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clubId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isOwner, isAdmin } = await isClubOwnerOrAdmin(clubId, user.id);
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the club owner or an existing admin can invite admins" },
        { status: 403 },
      );
    }

    const { data: club } = await supabaseAdmin
      .from("profiles")
      .select("id, account_type")
      .eq("id", clubId)
      .eq("account_type", "organisation")
      .single();

    if (!club) {
      return NextResponse.json(
        { error: "Club not found or is not an organisation" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const email: string = body.email?.trim().toLowerCase();
    const role: string = body.role ?? "admin";

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 },
      );
    }

    /* Look up the user by email via admin auth API */
    const { data: userList, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

    if (listError) {
      console.error("Failed to list users:", listError);
      return NextResponse.json({ error: "Failed to look up user" }, { status: 500 });
    }

    const targetUser = userList.users.find(
      (u) => u.email?.toLowerCase() === email,
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: "No account found with that email address" },
        { status: 404 },
      );
    }

    if (targetUser.id === clubId) {
      return NextResponse.json(
        { error: "Cannot invite the club itself as an admin" },
        { status: 400 },
      );
    }

    const { data: admins, error } = await supabaseAdmin
      .from("club_admins")
      .upsert(
        [{ club_id: clubId, user_id: targetUser.id, role, status: "pending", invited_by: user.id }],
        { onConflict: "club_id,user_id" },
      )
      .select("id, user_id, role, status");

    if (error) {
      console.error("Failed to create admin invite:", error);
      return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
    }

    return NextResponse.json({ data: { sent: admins?.length ?? 0, admins } });
  } catch (error) {
    console.error("POST /api/clubs/[id]/admins error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* DELETE /api/clubs/[id]/admins */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clubId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const targetUserId: string = body.user_id;

    if (!targetUserId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { isOwner } = await isClubOwnerOrAdmin(clubId, user.id);
    const isSelf = user.id === targetUserId;

    if (!isOwner && !isSelf) {
      return NextResponse.json(
        { error: "Only the club owner can remove other admins" },
        { status: 403 },
      );
    }

    const { error } = await supabaseAdmin
      .from("club_admins")
      .delete()
      .eq("club_id", clubId)
      .eq("user_id", targetUserId);

    if (error) {
      console.error("Failed to remove admin:", error);
      return NextResponse.json({ error: "Failed to remove admin" }, { status: 500 });
    }

    return NextResponse.json({ message: "Admin removed" });
  } catch (error) {
    console.error("DELETE /api/clubs/[id]/admins error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
