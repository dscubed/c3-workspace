import { AvatarProfile, AvatarStack } from "@/components/shared/AvatarStack";

interface HostAvatarStackProps {
  creator: AvatarProfile;
  hosts: AvatarProfile[];
  size?: "sm" | "md" | "lg";
}

/**
 * Renders a horizontally-overlapping stack of host avatars.
 * Shows the creator first, then up to 2 additional hosts, then a "+N" badge.
 */
export function HostAvatarStack({
  creator,
  hosts,
  size = "sm",
}: HostAvatarStackProps) {
  return (
    <div className="flex items-center -space-x-2">
      <AvatarStack profiles={[creator, ...hosts]} limit={3} size={size} />
    </div>
  );
}
