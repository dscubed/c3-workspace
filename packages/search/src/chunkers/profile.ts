import type { Chunk, ProfileRow } from "../types";

/**
 * Turns a profile row into a single "bio" chunk.
 * One profile → one embedding.
 */
export function chunkProfile(row: ProfileRow): Chunk[] {
  const displayName = row.full_name ?? row.username ?? row.id;
  const type = row.profile_type ?? "user";

  const lines: string[] = [
    `# ${type === "club" || type === "organisation" ? "Organisation" : "User"}: ${displayName}`,
  ];

  if (row.username) lines.push(`**Handle:** @${row.username}`);
  if (row.profile_type) lines.push(`**Type:** ${row.profile_type}`);
  if (row.category) lines.push(`**Category:** ${row.category}`);
  if (row.university) lines.push(`**University:** ${row.university}`);
  if (row.location) lines.push(`**Location:** ${row.location}`);
  if (row.bio) lines.push(`\n${row.bio}`);
  if (row.tags?.length)
    lines.push(`\n**Skills/Interests:** ${row.tags.join(", ")}`);
  if (row.website) lines.push(`**Website:** ${row.website}`);

  return [
    {
      entityType: "profile",
      entityId: row.id,
      chunkType: "bio",
      chunkIndex: 0,
      title: displayName,
      text: lines.join("\n"),
      metadata: {
        profile_type: row.profile_type,
        university: row.university,
        category: row.category,
      },
    },
  ];
}
