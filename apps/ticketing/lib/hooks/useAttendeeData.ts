"use client";

import { useState, useCallback } from "react";
import { useAuthStore } from "@c3/auth";
import { toast } from "sonner";
import type { AttendeeData } from "@c3/types";

export type { AttendeeData };

/**
 * Manages per-ticket attendee form data and "Buy for myself" autofill.
 *
 * `attendeeData[ticketIndex][fieldKey] = value`
 */
export function useAttendeeData() {
  const user = useAuthStore((s) => s.user);
  const [attendeeData, setAttendeeData] = useState<AttendeeData>({});
  const [fillingMyData, setFillingMyData] = useState(false);

  const getFieldValue = (ticketIndex: number, fieldKey: string): string =>
    attendeeData[ticketIndex]?.[fieldKey] ?? "";

  const setFieldValue = (
    ticketIndex: number,
    fieldKey: string,
    value: string,
  ) => {
    setAttendeeData((prev) => ({
      ...prev,
      [ticketIndex]: {
        ...(prev[ticketIndex] ?? {}),
        [fieldKey]: value,
      },
    }));
  };

  const handleBuyForMyself = useCallback(
    async (ticketIndex: number, clubId?: string) => {
      if (!user) return;
      setFillingMyData(true);
      try {
        const profileRes = fetch(
          `/api/profiles/fetch?id=${user.id}&select=first_name,last_name`,
        );
        const memberPromise = clubId
          ? fetch(`/api/profiles/membership?club_id=${clubId}`)
          : null;

        let isMember: boolean | null = null;
        if (memberPromise) {
          const mr = await memberPromise;
          if (mr.ok) {
            const mb = await mr.json();
            isMember = mb.data?.isMember ?? null;
          }
        }

        const res = await profileRes;
        if (res.ok) {
          const { data } = await res.json();
          setAttendeeData((prev) => ({
            ...prev,
            [ticketIndex]: {
              ...(prev[ticketIndex] ?? {}),
              first_name: data?.first_name ?? "",
              last_name: data?.last_name ?? "",
              email: user.email ?? "",
              ...(isMember !== null ? { is_member: isMember ? "Yes" : "No" } : {}),
            },
          }));
        }
      } catch {
        toast.error("Failed to load your details");
      } finally {
        setFillingMyData(false);
      }
    },
    [user],
  );

  return {
    user,
    attendeeData,
    getFieldValue,
    setFieldValue,
    handleBuyForMyself,
    fillingMyData,
  };
}
