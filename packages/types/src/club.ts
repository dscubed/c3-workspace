export type Club = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  university: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClubMember = {
  id: string;
  club_id: string;
  user_id: string;
  role: "member" | "admin" | "owner";
  joined_at: string;
};
