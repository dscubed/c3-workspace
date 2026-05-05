import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { RegistrationWithEvent } from "@c3/types";

interface RegistrationsResponse {
  data: RegistrationWithEvent[];
}

export function useRegistrations() {
  const { data, isLoading, error, mutate } = useSWR<RegistrationsResponse>(
    "/api/registrations",
    fetcher,
  );

  return {
    registrations: data?.data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useActiveRegistrations() {
  const { registrations, isLoading, error } = useRegistrations();

  const active = registrations.filter((r) => {
    const status = r.event_status;
    return status === "published" || status === "live" || status === "upcoming";
  });

  return { registrations: active, isLoading, error };
}
