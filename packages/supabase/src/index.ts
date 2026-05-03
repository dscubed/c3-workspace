export { createClient as createBrowserClient } from "./client";
export { createClient as createServerClient } from "./server";
export { updateSession } from "./middleware";
export { supabaseAdmin } from "./admin";
export { handleProfileFetch } from "./profileFetch";
export {
  getClubAdminRow,
  getAdminClubIds,
  resolveManagedProfileId,
  checkEventPermission,
  type EventPermission,
} from "./clubAdmin";
