export type Member = {
  id: string;
  matched_product_name: string;
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
