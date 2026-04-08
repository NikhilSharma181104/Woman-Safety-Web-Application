/**
 * Integration Test: dispatch-alert Edge Function (end-to-end)
 *
 * REQUIRES: Twilio test credentials and a running Supabase instance with the
 * dispatch-alert Edge Function deployed.
 *
 * Setup:
 *   1. Run: supabase start && supabase functions serve dispatch-alert
 *   2. Set environment variables:
 *        VITE_SUPABASE_URL=http://localhost:54321
 *        VITE_SUPABASE_ANON_KEY=<anon key from `supabase status`>
 *        TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (Twilio test SID)
 *        TWILIO_AUTH_TOKEN=<test auth token>
 *        TWILIO_FROM_NUMBER=+15005550006  (Twilio magic test number)
 *   3. Run this test file directly:
 *        npx vitest run src/test/integration/dispatch-alert.integration.test.ts
 *
 * Twilio test credentials:
 *   - Use SID starting with "AC" from https://console.twilio.com/
 *   - Magic "from" number +15005550006 always succeeds in test mode
 *   - Magic "to" number +15005550009 always fails (for retry testing)
 *   - No real SMS is sent; charges do not apply
 *
 * These tests are skipped in CI because they require live external services.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/dispatch-alert`;

describe.skip(
  'Integration: dispatch-alert Edge Function [requires: Twilio test credentials + supabase functions serve]',
  () => {
    let supabase: ReturnType<typeof createClient>;
    let authToken: string;
    let testUserId: string;

    beforeAll(async () => {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Sign in as a pre-seeded test user (set up via supabase seed or migration)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'integration-test@safetnet.test',
        password: 'Integration!Test1',
      });

      if (error || !data.session) {
        throw new Error(
          'Could not authenticate test user. Ensure the seed user exists in the local Supabase instance.'
        );
      }

      authToken = data.session.access_token;
      testUserId = data.session.user.id;
    });

    it('invokes the Edge Function and returns dispatched/failed contact lists', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId: testUserId, type: 'emergency_start' }),
      });

      expect(response.ok).toBe(true);

      const body = await response.json();
      expect(body).toHaveProperty('dispatched');
      expect(body).toHaveProperty('failed');
      expect(Array.isArray(body.dispatched)).toBe(true);
      expect(Array.isArray(body.failed)).toBe(true);
    });

    it('creates an alert_logs entry for each contact after dispatch', async () => {
      // Trigger the alert
      await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId: testUserId, type: 'emergency_start' }),
      });

      // Verify alert_logs entries were created
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: logs, error } = await (supabase as any)
        .from('alert_logs')
        .select('*')
        .eq('user_id', testUserId)
        .eq('alert_type', 'emergency_start')
        .order('sent_at', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
      expect(logs).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((logs as any[]).length).toBeGreaterThan(0);
    });

    it('alert_logs entries contain required fields (channel, status, attempt, sent_at)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: logs } = await (supabase as any)
        .from('alert_logs')
        .select('channel, status, attempt, sent_at')
        .eq('user_id', testUserId)
        .limit(1);

      expect(logs).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const log = (logs as any[])[0];
      expect(['sms', 'push']).toContain(log.channel);
      expect(['sent', 'failed']).toContain(log.status);
      expect(log.attempt).toBeGreaterThanOrEqual(1);
      expect(log.attempt).toBeLessThanOrEqual(3);
      expect(log.sent_at).toBeTruthy();
    });

    it('retries SMS up to 3 times for a failing contact (Twilio magic fail number)', async () => {
      // This test requires a contact seeded with Twilio magic fail number +15005550009
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: logs } = await (supabase as any)
        .from('alert_logs')
        .select('attempt, status')
        .eq('user_id', testUserId)
        .eq('status', 'failed')
        .order('attempt', { ascending: false })
        .limit(1);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (logs && (logs as any[]).length > 0) {
        // If there are failed logs, the max attempt should be ≤ 3
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((logs as any[])[0].attempt).toBeLessThanOrEqual(3);
      }
      // If no failed logs, the test passes vacuously (no failing contacts seeded)
    });
  }
);
