-- SafeTNet: pg_cron job for check-in expiry
-- Migration: 002_cron_job.sql
--
-- Prerequisites:
--   1. The pg_cron extension must be enabled in your Supabase project.
--      (Dashboard → Database → Extensions → pg_cron)
--   2. The check-in-expiry Edge Function must be deployed.
--   3. Replace <PROJECT_REF> with your Supabase project reference.
--   4. Replace <ANON_KEY> with your Supabase anon key (or a service-role key
--      if the function requires elevated privileges).

-- Enable pg_cron extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required by pg_cron)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Remove any existing job with the same name (idempotent re-run)
SELECT cron.unschedule('check-in-expiry-job')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-in-expiry-job'
);

-- Schedule the check-in-expiry Edge Function to run every minute.
-- The function polls for active check-ins where expires_at < now()
-- and calls dispatch-alert with type='checkin_expired' for each one.
SELECT cron.schedule(
  'check-in-expiry-job',   -- unique job name
  '* * * * *',             -- every minute (cron expression)
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/check-in-expiry',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
