// app/api/cron/cleanup-vector-stores/route.ts
//
// Cleanup cron job — removes unreferenced files from OpenAI vector stores.
// Invoked by Supabase pg_cron periodically (e.g., daily) via HTTP GET.
//
// Flow:
//   1. Fetch all openai_file_id from profiles table
//   2. Fetch all openai_file_id from events table
//   3. For each vector store (user, org, events):
//      - List all files in the vector store
//      - Delete files that aren't referenced in the database
//   4. Return summary of deleted files

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ─── Config ──────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;
const cronSecret = process.env.CRON_SECRET!;

const supabase = createClient(supabaseUrl, supabaseSecretKey);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Helper Functions ────────────────────────────────────────────

async function getReferencedFileIds(): Promise<{
  profileFileIds: Set<string>;
  eventFileIds: Set<string>;
}> {
  // Fetch all openai_file_id from profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("openai_file_id")
    .not("openai_file_id", "is", null);

  if (profilesError) {
    console.error("Error fetching profile file IDs:", profilesError);
    throw new Error("Failed to fetch profile file IDs");
  }

  // Fetch all openai_file_id from events
  const { data: events, error: eventsError } = await supabase
    .from("event_summary")
    .select("openai_file_id")
    .not("openai_file_id", "is", null);

  if (eventsError) {
    console.error("Error fetching event file IDs:", eventsError);
    throw new Error("Failed to fetch event file IDs");
  }

  const profileFileIds = new Set(
    profiles.map((p) => p.openai_file_id).filter((id): id is string => !!id),
  );
  const eventFileIds = new Set(
    events.map((e) => e.openai_file_id).filter((id): id is string => !!id),
  );

  return { profileFileIds, eventFileIds };
}

async function cleanupVectorStore(
  vectorStoreId: string,
  referencedFileIds: Set<string>,
  storeName: string,
): Promise<number> {
  console.log(`🧹 Cleaning up ${storeName} vector store (${vectorStoreId})...`);

  try {
    // Collect all unreferenced files first
    const filesToDelete: string[] = [];

    for await (const file of openai.vectorStores.files.list(vectorStoreId, {
      limit: 100,
    })) {
      if (!referencedFileIds.has(file.id)) {
        filesToDelete.push(file.id);
      }
    }

    if (filesToDelete.length === 0) {
      console.log(`✅ No files to delete from ${storeName}`);
      return 0;
    }

    console.log(
      `  Found ${filesToDelete.length} unreferenced files in ${storeName}`,
    );

    // Delete files in parallel batches to avoid rate limits
    const BATCH_SIZE = 10;
    let deletedCount = 0;

    for (let i = 0; i < filesToDelete.length; i += BATCH_SIZE) {
      const batch = filesToDelete.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (fileId) => {
          try {
            // Remove from vector store
            await openai.vectorStores.files.delete(fileId, {
              vector_store_id: vectorStoreId,
            });
            // Remove from OpenAI files
            await openai.files.delete(fileId);
            deletedCount++;
            console.log(`  ✅ Deleted file ${fileId} from ${storeName}`);
          } catch (error) {
            console.error(
              `  ⚠️  Failed to delete file ${fileId}:`,
              error instanceof Error ? error.message : String(error),
            );
          }
        }),
      );
    }

    console.log(
      `✅ Cleaned up ${deletedCount}/${filesToDelete.length} files from ${storeName}`,
    );
    return deletedCount;
  } catch (error) {
    console.error(`Error cleaning up ${storeName}:`, error);
    throw error;
  }
}

// ─── Main Handler ────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    // Verify the request is from Supabase pg_cron via CRON_SECRET
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting vector store cleanup...");

    // Get all referenced file IDs from database
    const { profileFileIds, eventFileIds } = await getReferencedFileIds();

    console.log(`📊 Found ${profileFileIds.size} referenced profile files`);
    console.log(`📊 Found ${eventFileIds.size} referenced event files`);

    // Vector store IDs
    const userVectorStoreId = process.env.OPENAI_USER_VECTOR_STORE_ID!;
    const orgVectorStoreId = process.env.OPENAI_ORG_VECTOR_STORE_ID!;
    const eventsVectorStoreId = process.env.OPENAI_EVENTS_VECTOR_STORE_ID!;

    if (!userVectorStoreId || !orgVectorStoreId || !eventsVectorStoreId) {
      throw new Error("Vector store IDs not configured");
    }

    // Clean up all three vector stores in parallel
    const [deletedFromUser, deletedFromOrg, deletedFromEvents] =
      await Promise.all([
        cleanupVectorStore(userVectorStoreId, profileFileIds, "User Profiles"),
        cleanupVectorStore(
          orgVectorStoreId,
          profileFileIds,
          "Organization Profiles",
        ),
        cleanupVectorStore(eventsVectorStoreId, eventFileIds, "Events"),
      ]);

    const totalDeleted = deletedFromUser + deletedFromOrg + deletedFromEvents;

    console.log(`✨ Cleanup complete! Total files deleted: ${totalDeleted}`);

    return Response.json(
      {
        success: true,
        deletedFiles: {
          userProfiles: deletedFromUser,
          orgProfiles: deletedFromOrg,
          events: deletedFromEvents,
          total: totalDeleted,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
