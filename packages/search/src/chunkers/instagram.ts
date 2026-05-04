import type { Chunk, InstagramPostRow } from "../types";

/**
 * Turns an Instagram post row into a single "post" chunk.
 * ownerName is resolved externally via instagram_club_fetches → profiles.
 */
export function chunkInstagramPost(
  row: InstagramPostRow,
  ownerName?: string,
): Chunk[] {
  const author = ownerName ?? row.posted_by ?? row.id;
  const lines: string[] = [`# Instagram post by ${author}`];

  if (row.posted_by) lines.push(`**Account:** @${row.posted_by}`);
  if (row.timestamp) lines.push(`**Posted:** ${fmtUnix(row.timestamp)}`);
  if (row.location) lines.push(`**Location:** ${row.location}`);

  if (row.caption) {
    const cleanCaption = row.caption
      .replace(/#\w+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleanCaption) lines.push(`\n${cleanCaption}`);

    const hashtags = row.caption.match(/#\w+/g);
    if (hashtags?.length) lines.push(`\n**Hashtags:** ${hashtags.join(" ")}`);
  }

  if (row.collaborators?.length)
    lines.push(`**With:** ${row.collaborators.join(", ")}`);

  const title = ownerName
    ? `${author} on Instagram`
    : `Instagram post ${row.id}`;

  return [
    {
      entityType: "instagram_post",
      entityId: row.id,
      chunkType: "post",
      chunkIndex: 0,
      title,
      text: lines.join("\n"),
      metadata: {
        posted_by: row.posted_by,
        location: row.location,
        image_count: row.images?.length ?? 0,
      },
    },
  ];
}

function fmtUnix(ts: number): string {
  try {
    return new Date(ts * 1000).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(ts);
  }
}
