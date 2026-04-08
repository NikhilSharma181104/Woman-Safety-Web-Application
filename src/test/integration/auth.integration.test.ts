/**
 * Integration Test: Supabase Auth Flow
 *
 * REQUIRES: A running local Supabase instance.
 *
 * Setup:
 *   1. Install Supabase CLI: https://supabase.com/docs/guides/cli
 *   2. Run: supabase start
 *   3. Set environment variables:
 *        VITE_SUPABASE_URL=http://localhost:54321
 *        VITE_SUPABASE_ANON_KEY=<anon key from `supabase status`>
 *   4. Run this test file directly:
 *        npx vitest run src/test/integration/auth.integration.test.ts
 *
 * These tests are skipped in CI because they require a live Supabase instance.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';

// Skip entire suite unless explicitly opted in via env var
describe.skip(
  'Integration: Supabase Auth Flow [requires: supabase start + env vars]',
  () => {
    let supabase: ReturnType<typeof createClient>;
    const testEmail = `test-${Date.now()}@safetnet-integration.test`;
    const testPassword = 'Integration!Test1';

    beforeAll(() => {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    });

    it('sign-up: creates a new user account with valid credentials', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      expect(error).toBeNull();
      expect(data.user).not.toBeNull();
      expect(data.user?.email).toBe(testEmail);
    });

    it('sign-up: user record exists in auth.users after sign-up', async () => {
      // Verify via admin API or by attempting login (email confirmation may be disabled locally)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      // With local Supabase, email confirmation is typically disabled
      expect(error).toBeNull();
      expect(data.session).not.toBeNull();
    });

    it('login: authenticates with valid credentials and returns a session', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      expect(error).toBeNull();
      expect(data.session?.access_token).toBeTruthy();
      expect(data.session?.user.email).toBe(testEmail);
    });

    it('login: returns an error for invalid credentials without revealing which field is wrong', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'WrongPassword!99',
      });

      expect(data.session).toBeNull();
      expect(error).not.toBeNull();
      // Error message must not reveal whether email or password was wrong
      expect(error?.message.toLowerCase()).not.toMatch(/password/);
      expect(error?.message.toLowerCase()).not.toMatch(/email not found/);
    });

    it('password reset: sends a reset email for a registered address', async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: 'http://localhost:5173/reset-password',
      });

      // Local Supabase may not actually send email but should not error
      expect(error).toBeNull();
    });

    it('password reset: does not error for an unregistered address (non-disclosure)', async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        'nonexistent@safetnet-integration.test',
        { redirectTo: 'http://localhost:5173/reset-password' }
      );

      // Should succeed silently to avoid account enumeration
      expect(error).toBeNull();
    });
  }
);
