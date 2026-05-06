export interface AvatarProfile {
  id: string;
  first_name: string;
  avatar_url: string | null;
}

export interface EventCardDetails {
  id: string;
  name: string | null;
  start: string | null;
  thumbnail: string | null;
  is_online: boolean;
  status: string;
  category: string | null;
  location_name: string | null;
  host: AvatarProfile;
  collaborators: AvatarProfile[] | null;
}

export interface EventCardDetailsWithStats extends EventCardDetails {
  registered: number;
  attended: number;
}

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventVisibility = "public" | "members_only" | "invite_only";

export type Event = {
  id: string;
  club_id: string;
  title: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  capacity: number | null;
  status: EventStatus;
  visibility: EventVisibility;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
};
