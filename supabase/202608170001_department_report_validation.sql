BEGIN;

ALTER TABLE public.department_monthly_reports
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

ALTER TABLE public.department_monthly_reports
  ADD COLUMN IF NOT EXISTS validated_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'department_monthly_reports_validated_by_fkey'
  ) THEN
    ALTER TABLE public.department_monthly_reports
      ADD CONSTRAINT department_monthly_reports_validated_by_fkey
      FOREIGN KEY (validated_by)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS department_monthly_reports_validation_idx
  ON public.department_monthly_reports (church_id, validated_at, report_month DESC);

NOTIFY pgrst, 'reload schema';

COMMIT;
