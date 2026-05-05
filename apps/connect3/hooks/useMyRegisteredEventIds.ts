import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMyRegisteredEventIds() {
  const { data, isLoading } = useSWR<{ data: string[] }>(
    "/api/registrations",
    fetcher,
  );

  return {
    registeredEventIds: new Set(data?.data ?? []),
    isLoading,
  };
}
