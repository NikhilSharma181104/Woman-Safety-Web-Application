# Fix SMS Issue - Step by Step

## The Problem

Your browser console shows: "Edge Function returned a non-2xx status code"

This means the Edge Function on Supabase is still using the OLD code that requires FCM_SERVER_KEY.

## CRITICAL: You Must Deploy the Updated Code

The changes I made to `supabase/functions/dispatch-alert/index.ts` are only on your LOCAL computer. They are NOT on Supabase servers yet.

---

## Step 1: Test Twilio Credentials (Optional but Recommended)

1. Open `test-twilio.html` in your browser
2. Click "Send Test SMS" button
3. Check if you receive SMS on +918369622735
4. If YES: Twilio works, problem is Edge Function
5. If NO: Twilio credentials are wrong

---

## Step 2: Deploy Updated Edge Function to Supabase

### Option A: Via Supabase Dashboard (EASIEST)

1. **Open Supabase Dashboard:**
   https://supabase.com/dashboard/project/piljiivsvownlhmhfxkr/functions

2. **Click on `dispatch-alert` function**

3. **Click "Edit" or "Details"**

4. **You should see a code editor**

5. **Open the file `supabase/functions/dispatch-alert/index.ts` on your computer**

6. **Select ALL the code (Ctrl+A) and Copy (Ctrl+C)**

7. **In Supabase Dashboard editor, select all existing code and DELETE it**

8. **Paste (Ctrl+V) the new code**

9. **Click "Deploy" or "Save"**

10. **Wait for deployment to complete (should show "Deployed successfully")**

---

## Step 3: Verify Secrets Are Set

1. **Go to Supabase Settings:**
   https://supabase.com/dashboard/project/piljiivsvownlhmhfxkr/settings/functions

2. **Check these secrets exist:**
   - `TWILIO_ACCOUNT_SID` = [Your Twilio Account SID]
   - `TWILIO_AUTH_TOKEN` = [Your Twilio Auth Token]
   - `TWILIO_FROM_NUMBER` = [Your Twilio Phone Number]

3. **If any are missing, click "Add Secret" and add them**

---

## Step 4: Test Emergency SOS Again

1. **Open your app:** http://localhost:5173/
2. **Login to Dashboard**
3. **Make sure you have at least 1 emergency contact added**
4. **Open Browser Console (F12)**
5. **Click "Emergency SOS" button**
6. **Check console for:**
   - "Response status: 200" (should be 200, NOT 401 or 500)
   - "Emergency alert dispatched: {dispatched: [...], failed: []}"

---

## Step 5: Check Supabase Function Logs

1. **Go to Function Logs:**
   https://supabase.com/dashboard/project/piljiivsvownlhmhfxkr/functions/dispatch-alert/logs

2. **Look for the latest execution**

3. **You should see:**
   - "Environment check:" with all variables as true
   - "Processing alert:" with your userId
   - "Contacts fetched:" with count > 0
   - "Sending SMS to: +918369622735"
   - "Twilio SMS response:" with status 200 or 201

4. **If you see errors, copy them and tell me**

---

## Common Issues

### "Edge Function returned a non-2xx status code"

- **Cause:** Old code still deployed OR missing secrets
- **Fix:** Deploy updated code (Step 2) and verify secrets (Step 3)

### "No emergency contacts found"

- **Cause:** No contacts in database
- **Fix:** Add emergency contact in Dashboard

### Twilio error "Invalid phone number"

- **Cause:** Phone format wrong
- **Fix:** Use +918369622735 format (with +91 prefix)

### Twilio error "Unverified number"

- **Cause:** Twilio trial account only allows verified numbers
- **Fix:** Verify +918369622735 in Twilio Console: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

---

## If Still Not Working

Tell me:

1. What does browser console show? (Response status: ???)
2. What do Supabase function logs show?
3. Did you deploy the updated code?
4. Did test-twilio.html work?
