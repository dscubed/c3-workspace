"use server";

import { claimGuestRegistrations as _claim } from "@c3/auth/server";

export async function claimGuestRegistrations(userId: string, email: string): Promise<number> {
  return _claim(userId, email);
}
