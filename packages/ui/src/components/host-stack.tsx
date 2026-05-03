import { AvatarProfile, AvatarStack } from "./avatar-stack";

export function HostStack({ organizers }: { organizers: AvatarProfile[] }) {
  if (!organizers.length) return null;
  const size = 18;
  const MAX = 3;
  const shown = organizers.slice(0, MAX);
  const extra = organizers.length - MAX;
  const [first] = organizers;
  const label =
    organizers.length === 1
      ? first.first_name
      : `${first.first_name} + ${organizers.length - 1} other${organizers.length - 1 > 1 ? "s" : ""}`;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        <AvatarStack profiles={shown} size="sm" limit={MAX} />
        {extra > 0 && (
          <div
            className="flex shrink-0 items-center justify-center rounded-full bg-gray-200 ring-2 ring-white"
            style={{
              width: size,
              height: size,
              marginLeft: -(size * 0.3),
              fontSize: size * 0.35,
            }}
          >
            <span className="font-semibold text-gray-500">+{extra}</span>
          </div>
        )}
      </div>
      <span className="text-[11px] text-muted-foreground truncate">
        {label}
      </span>
    </div>
  );
}
