export const formatDateTBA = (dateStr: string | null) => {
  if (!dateStr) return "TBA";
  return new Date(dateStr).toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
  });
};
