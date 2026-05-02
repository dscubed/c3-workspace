export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  university: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRole = "user" | "admin" | "super_admin";
