/**
 * Integration Test: pg_cron Check-In Expiry → Alert Log
 *
 * REQUIRES: A running local Supabase instance with pg_cron enabled and the
 * check-in-expiry cron job deployed (supabase/migrations/002_cron_job.sql).
 *
 * Setup:
 *   1. Run: supabase start
 *   2. Apply migrations: supabase db reset  (or supabase migration up)
 *   3. Set environment variables:
 *        VITE_SUPABASE_URL=http://localhost:54321
 *        VITE_SUPABASE_ANON_KEY=<anon key from `supabase status`>
 *        SUPABASE_SERVICE_ROLE_KEY=<service role key from `supabase status`>
 *   4. Run this test file directly:
 *        npx vitest run src/test/integration/checkin-expiry.integration.test.ts
 *
 * Note: pg_cron runs every minute. This test inserts an already-expired check-in
 * and waits up to 90 seconds for the cron job to fire and create an alert_logs entry.
 * Increase CRON_WAIT_MS if your environment is slower.
 *
 * These tests are skipped in CI because they require a live Supabase instance
 * with pg_cron and a 60+ second wait.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
// Service role key bypasses RLS for test setup/teardown
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// How long to wait for the cron job to fire (ms). pg_cron fires every 60 s.
const CRON_WAIT_MS = 90_000;

describe.skip(
  'Integration: pg_cron check-in expiry triggers alert_logs entry [requires: supabase start + pg_cron + ~90s wait]',
  () => {
    let supabase: ReturnType<typeof createClient>;
    let adminClient: ReturnType<typeof createClient>;
    let testUserId: string;
    let insertedCheckInId: string;

    beforeAll(async () => {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Authenticate as test user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'integration-test@safetnet.test',
        password: 'Integration!Test1',
      });

      if (error || !data.session) {
        throw new Error(
          'Could not authenticate test user. Ensure the seed user exists.'
        );
      }

      testUserId = data.session.user.id;
    });

    afterAll(async () => {
      // Clean up the test check-in and any generated alert logs
      if (insertedCheckInId) {
        await adminClient
          .from('alert_logs')
          .delete()
          .eq('user_id', testUserId);

        await adminClient
          .from('check_ins')
          .delete()
          .eq('id', insertedCheckInId);
      }
    });

    it(
      'inserts an expired check-in and verifies alert_logs entry is created within one cron tick',
      async () => {
        // Insert a check-in that expired 5 minutes ago
        const expiresAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: checkIn, error: insertError } = await (adminClient as any)
          .from('check_ins')
          .insert({
            user_id: testUserId,
            destination_label: 'Integration Test Destination',
            duration_minutes: 5,
            expires_at: expiresAt,
            status: 'active',
          })
          .select()
          .single();

        expect(insertError).toBeNull();
        expect(checkIn).not.toBeNull();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        insertedCheckInId = (checkIn as any).id;

        // Wait for pg_cron to fire (up to CRON_WAIT_MS)
        await new Promise((resolve) => setTimeout(resolve, CRON_WAIT_MS));

        // Verify an alert_logs entry was created for this check-in's user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: logs, error: logsError } = await (adminClient as any)
          .from('alert_logs')
          .select('*')
          .eq('user_id', testUserId)
          .eq('alert_type', 'checkin_expired');

        expect(logsError).toBeNull();
        expect(logs).not.toBeNull();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((logs as any[]).length).toBeGreaterThan(0);
      },
      CRON_WAIT_MS + 10_000 // vitest timeout must exceed the wait
    );

    it('check-in status is updated to "alerted" after cron fires', async () => {
      if (!insertedCheckInId) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: checkIn } = await (adminClient as any)
        .from('check_ins')
        .select('status')
        .eq('id', insertedCheckInId)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((checkIn as any)?.status).toBe('alerted');
    });

    it('alert_logs entry has alert_type = "checkin_expired"', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: logs } = await (adminClient as any)
        .from('alert_logs')
        .select('alert_type, channel, status')
        .eq('user_id', testUserId)
        .eq('alert_type', 'checkin_expired')
        .limit(1);

      expect(logs).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((logs as any[])[0].alert_type).toBe('checkin_expired');
    });
  }
);
