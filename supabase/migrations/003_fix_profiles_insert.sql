-- Fix: Add INSERT policy for profiles table
-- This allows users to insert their own profile row

CREATE POLICY "profiles: owner insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
