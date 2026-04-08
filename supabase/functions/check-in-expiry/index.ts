// Supabase Edge Function: check-in-expiry
// Deno runtime
// Called by pg_cron every minute to process expired check-ins.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ExpiredCheckIn {
  id: string;
  user_id: string;
  destination_label: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 1. Find all active check-ins that have expired
    const { data: expiredCheckIns, error: fetchError } = await supabase
      .from('check_ins')
      .select('id, user_id, destination_label')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('Failed to fetch expired check-ins:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!expiredCheckIns || expiredCheckIns.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results: { id: string; success: boolean }[] = [];

    for (const checkIn of expiredCheckIns as ExpiredCheckIn[]) {
      try {
        // 2. Call dispatch-alert with type='checkin_expired'
        const alertRes = await supabase.functions.invoke('dispatch-alert', {
          body: { userId: checkIn.user_id, type: 'checkin_expired' },
        });

        if (alertRes.error) {
          console.error(`dispatch-alert failed for check-in ${checkIn.id}:`, alertRes.error);
          results.push({ id: checkIn.id, success: false });
          continue;
        }

        // 3. Update check-in status to 'alerted'
        const { error: updateError } = await supabase
          .from('check_ins')
          .update({ status: 'alerted' })
          .eq('id', checkIn.id);

        if (updateError) {
          console.error(`Failed to update check-in ${checkIn.id} to alerted:`, updateError);
          results.push({ id: checkIn.id, success: false });
        } else {
          results.push({ id: checkIn.id, success: true });
        }
      } catch (err) {
        console.error(`Error processing check-in ${checkIn.id}:`, err);
        results.push({ id: checkIn.id, success: false });
      }
    }

    const processed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return new Response(JSON.stringify({ processed, failed, results }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('check-in-expiry error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
