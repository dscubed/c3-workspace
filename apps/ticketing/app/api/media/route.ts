import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export type MediaCategory = "images" | "companies" | "panelists" | "instagram";

interface MediaItem {
  name: string;
  url: string;
  /** ISO timestamp */
  created_at: string;
}

interface PaginatedResponse {
  items: MediaItem[];
  cursor: string | null;
}

function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset })).toString("base64");
}

function decodeCursor(cursor: string): number {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const { offset } = JSON.parse(decoded);
    return offset;
  } catch {
    return 0;
  }
}

/* ================================================================
   GET /api/media?category=images&limit=40&cursor=...
   Lists files in the user's media folder with cursor pagination.
================================================================ */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") ||
      "images") as MediaCategory;
    const limit = Math.min(parseInt(searchParams.get("limit") || "40"), 100);
    const cursor = searchParams.get("cursor");
    const offset = cursor ? decodeCursor(cursor) : 0;

    const folder = `${user.id}/${category}`;
    const { data: files, error } = await supabaseAdmin.storage
      .from("media")
      .list(folder, {
        sortBy: { column: "created_at", order: "desc" },
        limit: limit + 1,
        offset,
      });

    if (error) {
      console.error("Media list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allFiles = (files ?? []).filter(
      (f) => f.name !== ".emptyFolderPlaceholder"
    );
    const hasMore = allFiles.length > limit;
    const pageFiles = hasMore ? allFiles.slice(0, limit) : allFiles;

    const items: MediaItem[] = pageFiles.map((f) => ({
      name: f.name,
      url: `${SUPABASE_URL}/storage/v1/object/public/media/${folder}/${f.name}`,
      created_at: f.created_at ?? "",
    }));

    const nextCursor = hasMore ? encodeCursor(offset + limit) : null;

    return NextResponse.json({
      items,
      cursor: nextCursor,
      data: items, // backwards compat for useMediaStorage
    });
  } catch (error) {
    console.error("GET /api/media error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ================================================================
   POST /api/media
   Uploads a file to the user's media folder.
   FormData: file (File), category (string)
================================================================ */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "images";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${user.id}/${category}/${fileName}`;

    // Convert Web API File → ArrayBuffer so supabase-js works reliably in Node
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabaseAdmin.storage
      .from("media")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) {
      console.error("Media upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;

    return NextResponse.json({ url, name: fileName }, { status: 201 });
  } catch (error) {
    console.error("POST /api/media error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ================================================================
   DELETE /api/media
   Deletes a file from the user's media folder.
   Body: { category: string, fileName: string }
================================================================ */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category, fileName } = await request.json();
    if (!category || !fileName) {
      return NextResponse.json(
        { error: "category and fileName are required" },
        { status: 400 },
      );
    }

    const path = `${user.id}/${category}/${fileName}`;

    const { error } = await supabaseAdmin.storage.from("media").remove([path]);

    if (error) {
      console.error("Media delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/media error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
