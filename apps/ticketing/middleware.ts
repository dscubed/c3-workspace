import { updateSession } from "@c3/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest): Promise<Response> {
  // Type cast needed: pnpm resolves next@16.2.4 to two separate instances
  // (different @babel/core peer dep hashes) so TypeScript sees incompatible
  // types even though they are structurally identical at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await updateSession(request as any);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
