export type ChurchStatus = "active" | "inactive";

export type Church = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  service_times?: string | null;
  status: ChurchStatus;
  created_at: string;
  updated_at?: string | null;
};