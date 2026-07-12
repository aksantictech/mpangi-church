export type ChurchExtension = {
  id: string;
  church_id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  responsible_name?: string | null;
  responsible_phone?: string | null;
  status: "active" | "inactive" | "archived";
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type ExtensionActivityType = {
  id: string;
  church_id?: string | null;
  name: string;
  status: "active" | "inactive";
  sort_order: number;
};

export type ExtensionWeeklyActivity = {
  id: string;
  church_id: string;
  extension_id: string;
  week_start: string;
  week_end: string;
  activity_date: string;
  activity_type: string;
  men_count: number;
  women_count: number;
  children_count: number;
  total_participants: number;
  new_converts_count: number;
  new_visitors_count: number;
  income_amount: number;
  expense_amount: number;
  balance_amount: number;
  currency: string;
  summary?: string | null;
  needs?: string | null;
  status: "draft" | "submitted" | "validated" | "archived";
  submitted_by?: string | null;
  validated_by?: string | null;
  validated_at?: string | null;
  created_at: string;
  updated_at: string;
  church_extensions?: ChurchExtension | null;
};
