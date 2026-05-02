import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { createClient } from "@c3/supabase/server";

async function canAccessClub(clubId: string, userId: string): Promise<boolean> {
  if (clubId === userId) return true;
  const { data } = await supabaseAdmin
    .from("club_admins")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();
  return !!data;
}

/* GET /api/clubs/[id]/membership-product */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clubId } = await params;
    if (!(await canAccessClub(clubId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("club_membership_products")
      .select("club_id, product_name, normalized_product_name, enabled")
      .eq("club_id", clubId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/clubs/[id]/membership-product error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* PUT /api/clubs/[id]/membership-product */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clubId } = await params;
    if (!(await canAccessClub(clubId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const productName: string = (body.product_name ?? "").trim();

    if (!productName) {
      return NextResponse.json({ error: "product_name is required" }, { status: 400 });
    }

    const normalizedProductName = productName.toLowerCase().replace(/\s+/g, " ").trim();

    const { error } = await supabaseAdmin
      .from("club_membership_products")
      .upsert(
        {
          club_id: clubId,
          product_name: productName,
          normalized_product_name: normalizedProductName,
          enabled: true,
        },
        { onConflict: "club_id" },
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/clubs/[id]/membership-product error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
