export type TierWindowStatus =
  | { type: "open" }
  | { type: "opens_in"; label: string }
  | { type: "closes_in"; label: string }
  | { type: "closed" };

function formatCountdown(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface TierWindowInput {
  offerStartDate?: string;
  offerStartTime?: string;
  offerEndDate?: string;
  offerEndTime?: string;
}

export function getTierWindowStatus(tier: TierWindowInput): TierWindowStatus {
  const now = Date.now();

  const start =
    tier.offerStartDate && tier.offerStartTime
      ? new Date(`${tier.offerStartDate}T${tier.offerStartTime}`).getTime()
      : null;
  const end =
    tier.offerEndDate && tier.offerEndTime
      ? new Date(`${tier.offerEndDate}T${tier.offerEndTime}`).getTime()
      : null;

  if (start !== null && now < start) {
    return { type: "opens_in", label: `Opens in ${formatCountdown(start - now)}` };
  }
  if (end !== null && now > end) {
    return { type: "closed" };
  }
  if (end !== null && now < end) {
    return { type: "closes_in", label: `Closes in ${formatCountdown(end - now)}` };
  }
  return { type: "open" };
}
