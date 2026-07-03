export type MemberType =
  | "pasteur"
  | "ouvrier"
  | "responsable"
  | "membre"
  | "nouveau_converti"
  | "nouveau_accueilli"
  | "visiteur"
  | "inactif";

export type MemberStatus =
  | "actif"
  | "nouveau"
  | "a_suivre"
  | "en_suivi"
  | "integre"
  | "irregulier"
  | "inactif"
  | "transfere";

export type Member = {
  id: string;
  church_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  gender?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  commune?: string | null;
  quarter?: string | null;
  birth_date?: string | null;
  marital_status?: string | null;
  profession?: string | null;
  member_type: MemberType;
  spiritual_status?: string | null;
  photo_url?: string | null;
  qr_code?: string | null;
  status: MemberStatus;
  created_at: string;
  updated_at?: string | null;
};