-- SafeTNet Initial Schema
-- Migration: 001_initial_schema.sql

-- ============================================================
-- TABLES
-- ============================================================

-- profiles: one row per auth user
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text        NOT NULL DEFAULT '',
  avatar_url   text,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- emergency_contacts: up to 5 per user
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  phone      text        NOT NULL,
  email      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- location_updates: GPS coordinates written during Emergency_Mode
CREATE TABLE IF NOT EXISTS public.location_updates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude    float8      NOT NULL,
  longitude   float8      NOT NULL,
  accuracy    float8,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- check_ins: timer-based safety check-ins
CREATE TABLE IF NOT EXISTS public.check_ins (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination_label   text        NOT NULL,
  duration_minutes    int4        NOT NULL CHECK (duration_minutes BETWEEN 5 AND 1440),
  expires_at          timestamptz NOT NULL,
  status              text        NOT NULL CHECK (status IN ('active', 'completed', 'alerted')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- alert_logs: record of every alert dispatch attempt
CREATE TABLE IF NOT EXISTS public.alert_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id  uuid        NOT NULL REFERENCES public.emergency_contacts(id) ON DELETE CASCADE,
  alert_type  text        NOT NULL CHECK (alert_type IN ('emergency_start', 'emergency_end', 'checkin_expired')),
  channel     text        NOT NULL CHECK (channel IN ('sms', 'push')),
  status      text        NOT NULL CHECK (status IN ('sent', 'failed')),
  attempt     int4        NOT NULL CHECK (attempt BETWEEN 1 AND 3),
  sent_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_user_id   ON public.location_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_recorded  ON public.location_updates(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id          ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_status_expires   ON public.check_ins(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_alert_logs_user_id         ON public.alert_logs(user_id);

-- ============================================================
-- MAX-5-CONTACTS TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_max_emergency_contacts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.emergency_contacts WHERE user_id = NEW.user_id
  ) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 emergency contacts allowed per user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_max_emergency_contacts ON public.emergency_contacts;
CREATE TRIGGER trg_max_emergency_contacts
  BEFORE INSERT ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_emergency_contacts();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_logs         ENABLE ROW LEVEL SECURITY;

-- ---- profiles ----
CREATE POLICY "profiles: owner select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---- emergency_contacts ----
CREATE POLICY "contacts: owner select"
  ON public.emergency_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contacts: owner insert"
  ON public.emergency_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts: owner update"
  ON public.emergency_contacts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts: owner delete"
  ON public.emergency_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- ---- location_updates ----
-- Owning user can insert
CREATE POLICY "location: owner insert"
  ON public.location_updates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owning user can read their own rows
CREATE POLICY "location: owner select"
  ON public.location_updates FOR SELECT
  USING (auth.uid() = user_id);

-- Emergency contacts of the owning user can also read location rows
CREATE POLICY "location: contacts select"
  ON public.location_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.emergency_contacts ec
      WHERE ec.user_id = location_updates.user_id
        AND ec.user_id IN (
          SELECT id FROM public.profiles WHERE id = location_updates.user_id
        )
        AND auth.uid() IN (
          -- contacts are identified by their own profile id matching a contact record
          -- this policy allows a contact whose profile.id matches any contact row for this user
          SELECT p.id FROM public.profiles p
          INNER JOIN public.emergency_contacts ec2
            ON ec2.user_id = location_updates.user_id
          WHERE p.id = auth.uid()
        )
    )
  );

-- ---- check_ins ----
CREATE POLICY "checkins: owner select"
  ON public.check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "checkins: owner insert"
  ON public.check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checkins: owner update"
  ON public.check_ins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checkins: owner delete"
  ON public.check_ins FOR DELETE
  USING (auth.uid() = user_id);

-- ---- alert_logs ----
-- Users can read their own alert logs
CREATE POLICY "alert_logs: owner select"
  ON public.alert_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (Edge Functions run as service role)
-- No INSERT policy for authenticated role means only service_role bypass applies
