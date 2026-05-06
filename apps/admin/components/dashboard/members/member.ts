export type Member = {
  id: string;
  club_membership_products: { product_name: string } | null;
  verified_email: string;
  verified_at: string | null;
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type ProductConfig = {
  product_name: string;
  normalized_product_name: string;
  enabled: boolean;
} | null;
