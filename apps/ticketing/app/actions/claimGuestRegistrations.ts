"use server";

import { claimGuestRegistrations as _claimGuestRegistrations } from "@c3/auth/server";

export async function claimGuestRegistrations(userId: string, email: string) {
  return _claimGuestRegistrations(userId, email);
}