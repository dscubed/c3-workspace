export const formatDateTBA = (dateStr: string | null) => {
  if (!dateStr) return "TBA";
  return new Date(dateStr).toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
  });
};

export interface VenueLike {
  type: string;
  location: { displayName: string; address: string; lat?: number; lon?: number };
}

export interface OccurrenceLike {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export function getLocationInfo(venues: VenueLike[]) {
  const primary = venues.find((v) => v.type !== "tba");
  return {
    locationType: primary?.type ?? "tba",
    location: primary?.location ?? ({ displayName: "", address: "" } as const),
    isOnline: venues.some((v) => v.type === "online"),
  };
}

export function getEffectiveDates(occurrences: OccurrenceLike[]) {
  if (occurrences.length === 0) {
    return { startDate: "", startTime: "", endDate: "", endTime: "" };
  }
  const sorted = [...occurrences].sort((a, b) =>
    (a.startDate + a.startTime).localeCompare(b.startDate + b.startTime),
  );
  const first = sorted[0]!;
  return {
    startDate: first.startDate,
    startTime: first.startTime,
    endDate: first.endDate,
    endTime: first.endTime,
  };
}
