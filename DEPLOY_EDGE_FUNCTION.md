# Deploy Edge Function to Fix SMS Issue

## Problem

The Edge Function is returning 401 Unauthorized error because `FCM_SERVER_KEY` is required but not set.

## Solution

Updated the Edge Function to make FCM optional and added better logging.

## Steps to Deploy

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/piljiivsvownlhmhfxkr
2. Click on "Edge Functions" in the left sidebar
3. Find the `dispatch-alert` function
4. Click "Edit Function"
5. Copy the ENTIRE content from `supabase/functions/dispatch-alert/index.ts`
6. Paste it into the editor (replace all existing code)
7. Click "Deploy"

### Option 2: Via Supabase CLI

If you have Supabase CLI installed:

```bash
supabase functions deploy dispatch-alert
```

## Verify Secrets Are Set

Go to: https://supabase.com/dashboard/project/piljiivsvownlhmhfxkr/settings/functions

Make sure these secrets exist:

- `TWILIO_ACCOUNT_SID` = [Your Twilio Account SID]
- `TWILIO_AUTH_TOKEN` = [Your Twilio Auth Token]
- `TWILIO_FROM_NUMBER` = [Your Twilio Phone Number]

Note: `FCM_SERVER_KEY` is now optional (for push notifications)

## Test After Deployment

1. Open your app at http://localhost:5173/
2. Login and go to Dashboard
3. Make sure you have at least one emergency contact added
4. Click "Emergency SOS" button
5. Check browser console for detailed logs
6. Check Supabase Dashboard → Edge Functions → dispatch-alert → Logs for server-side logs

## What Changed

- Made `FCM_SERVER_KEY` optional (no longer required)
- Added detailed logging to help debug issues
- Added error handling in SMS sending
- Added console logs for environment variables, contacts, and Twilio responses
