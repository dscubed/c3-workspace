/* ── Shared helper: relative "last saved" label ── */

import { useEffect, useState } from "react";

function formatRelativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "Saved just now";
  if (seconds < 60) return "Saved seconds ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "Saved 1 min ago";
  if (minutes < 60) return `Saved ${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Saved 1 hr ago";
  if (hours < 24) return `Saved ${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Saved 1 day ago";
  if (days < 7) return `Saved ${days} days ago`;
  return "Saved a while ago";
}

/** Ticking "Saved X ago" label — re-renders every 30 s. */
export function LastSavedLabel({ date }: { date: Date }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [date]);

  void tick;
  return <>{formatRelativeTime(date)}</>;
}
