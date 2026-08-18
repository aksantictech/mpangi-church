BEGIN;

ALTER TABLE public.admin_correspondences
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS validated_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_correspondences_validated_by_fkey'
  ) THEN
    ALTER TABLE public.admin_correspondences
      ADD CONSTRAINT admin_correspondences_validated_by_fkey
      FOREIGN KEY (validated_by)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_correspondence_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  correspondence_id uuid NOT NULL REFERENCES public.admin_correspondences(id) ON DELETE CASCADE,
  action_type text NOT NULL DEFAULT 'status_update',
  previous_status text,
  status text,
  comment text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_correspondence_history_correspondence_idx
  ON public.admin_correspondence_history(church_id, correspondence_id, created_at DESC);

INSERT INTO public.admin_correspondence_history (
  church_id,
  correspondence_id,
  action_type,
  status,
  comment,
  created_by,
  created_at
)
SELECT
  c.church_id,
  c.id,
  'existing',
  c.status,
  'Courrier existant repris dans le nouvel historique de traitement.',
  c.created_by,
  COALESCE(c.created_at, now())
FROM public.admin_correspondences c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.admin_correspondence_history h
  WHERE h.correspondence_id = c.id
);

CREATE TABLE IF NOT EXISTS public.admin_correspondence_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  correspondence_id uuid NOT NULL REFERENCES public.admin_correspondences(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  priority text NOT NULL DEFAULT 'normal',
  read_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_correspondence_notifications_profile_idx
  ON public.admin_correspondence_notifications(church_id, profile_id, read_at, created_at DESC);

ALTER TABLE public.admin_correspondence_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_correspondence_notifications ENABLE ROW LEVEL SECURITY;

-- The application writes these tables only through server-side service-role actions.
-- Authenticated users may read history only for their own church.
DROP POLICY IF EXISTS "correspondence history same church read" ON public.admin_correspondence_history;
CREATE POLICY "correspondence history same church read"
ON public.admin_correspondence_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.church_id = admin_correspondence_history.church_id
      AND COALESCE(p.status, 'active') = 'active'
  )
);

DROP POLICY IF EXISTS "correspondence notifications own read" ON public.admin_correspondence_notifications;
CREATE POLICY "correspondence notifications own read"
ON public.admin_correspondence_notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.id = admin_correspondence_notifications.profile_id
      AND p.church_id = admin_correspondence_notifications.church_id
      AND COALESCE(p.status, 'active') = 'active'
  )
);

COMMIT;

NOTIFY pgrst, 'reload schema';
