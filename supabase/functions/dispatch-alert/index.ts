// Supabase Edge Function: dispatch-alert
// Deno runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER')!;
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY'); // Optional - for push notifications

const TWILIO_SMS_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
const TWILIO_CALLS_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
const FCM_URL = 'https://fcm.googleapis.com/fcm/send';
const MAX_SMS_ATTEMPTS = 3;
const RETRY_DELAY_MS = 30_000;

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Location {
  latitude: number;
  longitude: number;
  recorded_at: string;
}

type AlertType = 'emergency_start' | 'emergency_end' | 'checkin_expired';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSmsBody(
  userName: string,
  alertType: AlertType,
  location: Location | null,
  timestamp: string,
): string {
  const actionLabel =
    alertType === 'emergency_start'
      ? '🚨 EMERGENCY ALERT'
      : alertType === 'emergency_end'
        ? '✅ SAFE — Emergency Ended'
        : '⏰ CHECK-IN EXPIRED';

  const locationPart = location
    ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude} (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`
    : 'Location: unavailable';

  return `${actionLabel}\n${userName} needs help.\n${locationPart}\nTime: ${timestamp}`;
}

async function sendSms(to: string, body: string): Promise<boolean> {
  try {
    // Ensure phone number has + prefix for international format
    let phoneNumber = to.trim();
    if (!phoneNumber.startsWith('+')) {
      // If it's a 10-digit Indian number, add +91
      if (phoneNumber.length === 10 && /^\d{10}$/.test(phoneNumber)) {
        phoneNumber = `+91${phoneNumber}`;
      } else if (phoneNumber.length === 12 && phoneNumber.startsWith('91')) {
        // If it starts with 91 but no +, add the +
        phoneNumber = `+${phoneNumber}`;
      } else {
        // Default: just add + if missing
        phoneNumber = `+${phoneNumber}`;
      }
    }

    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const params = new URLSearchParams({ To: phoneNumber, From: TWILIO_FROM_NUMBER, Body: body });

    console.log('Sending SMS to:', phoneNumber, '(original:', to, ')');

    const res = await fetch(TWILIO_SMS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await res.text();
    console.log('Twilio SMS response:', { status: res.status, ok: res.ok, body: responseText });

    return res.ok;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
}

async function makeCall(to: string, message: string): Promise<boolean> {
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  // TwiML for text-to-speech
  const twiml = `<Response><Say voice="alice">${message}</Say></Response>`;
  const twimlUrl = `data:text/xml,${encodeURIComponent(twiml)}`;
  
  const params = new URLSearchParams({
    To: to,
    From: TWILIO_FROM_NUMBER,
    Url: twimlUrl,
  });

  const res = await fetch(TWILIO_CALLS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  return res.ok;
}

async function sendPush(contact: Contact, body: string): Promise<void> {
  // Skip if FCM is not configured
  if (!FCM_SERVER_KEY) {
    return;
  }
  
  // FCM requires a device token; we use the contact email as a topic fallback
  await fetch(FCM_URL, {
    method: 'POST',
    headers: {
      Authorization: `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: `/topics/user_${contact.id}`,
      notification: {
        title: 'SafeTNet Alert',
        body,
      },
    }),
  });
}

async function logAttempt(
  userId: string,
  contactId: string,
  alertType: AlertType,
  channel: 'sms' | 'push',
  status: 'sent' | 'failed',
  attempt: number,
): Promise<void> {
  await supabase.from('alert_logs').insert({
    user_id: userId,
    contact_id: contactId,
    alert_type: alertType,
    channel,
    status,
    attempt,
    sent_at: new Date().toISOString(),
  });
}

async function dispatchToContact(
  userId: string,
  contact: Contact,
  alertType: AlertType,
  smsBody: string,
): Promise<boolean> {
  let success = false;

  // Send SMS
  for (let attempt = 1; attempt <= MAX_SMS_ATTEMPTS; attempt++) {
    const ok = await sendSms(contact.phone, smsBody);
    const status = ok ? 'sent' : 'failed';

    await logAttempt(userId, contact.id, alertType, 'sms', status, attempt);

    if (ok) {
      success = true;
      break;
    }

    if (attempt < MAX_SMS_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  // Send FCM push notification (best-effort)
  try {
    await sendPush(contact, smsBody);
    await logAttempt(userId, contact.id, alertType, 'push', 'sent', 1);
  } catch {
    await logAttempt(userId, contact.id, alertType, 'push', 'failed', 1);
  }

  return success;
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
    // Log environment check
    console.log('Environment check:', {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceRole: !!SUPABASE_SERVICE_ROLE_KEY,
      hasTwilioSid: !!TWILIO_ACCOUNT_SID,
      hasTwilioAuth: !!TWILIO_AUTH_TOKEN,
      hasTwilioFrom: !!TWILIO_FROM_NUMBER,
      hasFcm: !!FCM_SERVER_KEY,
    });

    const { userId, type } = (await req.json()) as { userId: string; type: AlertType };

    if (!userId || !type) {
      return new Response(JSON.stringify({ error: 'userId and type are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing alert:', { userId, type });

    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    const userName = profile?.display_name ?? 'SafeTNet User';

    // 2. Fetch emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('id, name, phone, email')
      .eq('user_id', userId);

    console.log('Contacts fetched:', { count: contacts?.length, error: contactsError });

    if (contactsError || !contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ dispatched: [], failed: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Fetch latest location
    const { data: locationRow } = await supabase
      .from('location_updates')
      .select('latitude, longitude, recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    const location: Location | null = locationRow ?? null;

    // 4. Build message with timestamp (Requirement 3.5)
    const timestamp = new Date().toISOString();
    const smsBody = buildSmsBody(userName, type, location, timestamp);

    // 5. Dispatch to each contact
    const dispatched: Contact[] = [];
    const failed: Contact[] = [];

    await Promise.all(
      contacts.map(async (contact: Contact) => {
        const success = await dispatchToContact(userId, contact, type, smsBody);
        if (success) {
          dispatched.push(contact);
        } else {
          failed.push(contact);
        }
      }),
    );

    return new Response(JSON.stringify({ dispatched, failed }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('dispatch-alert error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
