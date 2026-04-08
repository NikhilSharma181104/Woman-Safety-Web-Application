# SMS Not Working - Debug Checklist

## Issue

SMS was working before but now returns 401 Unauthorized error.

## Root Cause

Edge Function was failing because `FCM_SERVER_KEY` environment variable was required but not set.

## Fix Applied

Updated `supabase/functions/dispatch-alert/index.ts` to:

1. Make FCM_SERVER_KEY optional (not required)
2. Add detailed logging for debugging
3. Add error handling in SMS sending
4. Log environment variables, contacts, and Twilio responses

## Next Steps

### 1. Deploy Updated Edge Function

Go to Supabase Dashboard:
https://supabase.com/dashboard/project/piljiivsvownlhmhfxkr/functions

- Click on `dispatch-alert` function
- Click "Edit Function"
- Copy ALL code from `supabase/functions/dispatch-alert/index.ts`
- Paste and replace everything in the editor
- Click "Deploy"

### 2. Verify Secrets

Go to: https://supabase.com/dashboard/project/piljiivsvownlhmhfxkr/settings/functions

Check these secrets exist:

- ✅ `TWILIO_ACCOUNT_SID` = [Your Twilio Account SID]
- ✅ `TWILIO_AUTH_TOKEN` = [Your Twilio Auth Token]
- ✅ `TWILIO_FROM_NUMBER` = [Your Twilio Phone Number]
- ⚠️ `FCM_SERVER_KEY` = (optional, can be empty)

### 3. Verify Emergency Contacts

Make sure you have at least one emergency contact added:

- Login to your app
- Go to Dashboard
- Check "Emergency Contacts" section
- Should have at least one contact with phone number in +91XXXXXXXXXX format

### 4. Test SMS

1. Open app at http://localhost:5173/
2. Login
3. Go to Dashboard
4. Open browser console (F12)
5. Click "Emergency SOS" button
6. Check console logs for:
   - "Triggering emergency alert for user: [your-user-id]"
   - "Response status: 200" (should be 200, not 401)
   - "Emergency alert dispatched: {dispatched: [...], failed: [...]}"

### 5. Check Supabase Logs

Go to: https://supabase.com/dashboard/project/piljiivsvownlhmhfxkr/functions/dispatch-alert/logs

Look for:

- "Environment check:" - should show all Twilio variables as true
- "Processing alert:" - should show your userId
- "Contacts fetched:" - should show count > 0
- "Sending SMS to:" - should show phone number
- "Twilio SMS response:" - should show status 200 or 201

### 6. Common Issues

**401 Error:**

- Edge Function not deployed with updated code
- Missing Twilio secrets in Supabase

**No contacts found:**

- Add emergency contact in Dashboard
- Check phone number format: +91XXXXXXXXXX

**Twilio error:**

- Verify Twilio credentials are correct
- Check Twilio account has credits
- Verify phone number +17405612356 is active

**SMS not received:**

- Check Twilio logs: https://console.twilio.com/us1/monitor/logs/sms
- Verify recipient number is correct
- Check if number is verified in Twilio trial account
