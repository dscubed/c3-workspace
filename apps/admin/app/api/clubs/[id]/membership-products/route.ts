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

/* GET /api/clubs/[id]/membership-products */
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
      .select("id, product_name, created_at, updated_by:updated_by(first_name, last_name)")
      .eq("club_id", clubId)
      .eq("enabled", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("GET /api/clubs/[id]/membership-products error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* POST /api/clubs/[id]/membership-products */
export async function POST(
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

    // Check current count
    const { data: existing, error: countError } = await supabaseAdmin
      .from("club_membership_products")
      .select("id")
      .eq("club_id", clubId)
      .eq("enabled", true);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((existing?.length ?? 0) >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 products allowed" },
        { status: 400 },
      );
    }

    // Insert new product
    const { data, error } = await supabaseAdmin
      .from("club_membership_products")
      .insert({
        club_id: clubId,
        product_name: productName,
        enabled: true,
        updated_by: user.id,
      })
      .select("id, product_name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data?.[0] });
  } catch (err) {
    console.error("POST /api/clubs/[id]/membership-products error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* DELETE /api/clubs/[id]/membership-products/[productId] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; productId: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clubId, productId } = await params;
    if (!(await canAccessClub(clubId, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify product belongs to club
    const { data: product, error: fetchError } = await supabaseAdmin
      .from("club_membership_products")
      .select("id")
      .eq("id", productId)
      .eq("club_id", clubId)
      .maybeSingle();

    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("club_membership_products")
      .delete()
      .eq("id", productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/clubs/[id]/membership-products error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
