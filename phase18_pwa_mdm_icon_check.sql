-- Phase 18 - Diagnostic icône PWA MDM
-- À exécuter dans Supabase SQL Editor pour vérifier la ligne MDM.

select
  id,
  name,
  public_name,
  slug,
  logo_url,
  theme_color,
  background_color,
  updated_at
from public.churches
where slug = 'maison-misericorde-cmp';

-- Si logo_url est vide ou pointe vers le logo Mpangi-church,
-- remplace URL_PUBLIQUE_LOGO_MDM par l’URL publique Supabase Storage du vrai logo MDM.
--
-- update public.churches
-- set
--   logo_url = 'URL_PUBLIQUE_LOGO_MDM',
--   updated_at = now()
-- where slug = 'maison-misericorde-cmp';
--
-- notify pgrst, 'reload schema';
