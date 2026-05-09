#!/usr/bin/env bash
# Usage: bash scripts/test-twilio.sh <ACCOUNT_SID> <AUTH_TOKEN>
# Sends a test WhatsApp from your Twilio sandbox directly to your opted-in phone.
# Bypasses n8n entirely — proves whether Twilio→WhatsApp works.

SID="${1:-}"
TOKEN="${2:-}"
TO="whatsapp:+919567085466"
FROM="whatsapp:+14155238886"

if [ -z "$SID" ] || [ -z "$TOKEN" ]; then
  echo "Usage: bash scripts/test-twilio.sh <ACCOUNT_SID> <AUTH_TOKEN>"
  echo "Example: bash scripts/test-twilio.sh ACxxxx... yourauthtoken"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "Direct Twilio sandbox test"
echo "From: $FROM"
echo "To:   $TO"
echo "═══════════════════════════════════════════════════════"
echo

# Step 1: send the message
echo "[1/2] Sending message..."
SEND_RESP=$(curl -s -u "$SID:$TOKEN" \
  -X POST "https://api.twilio.com/2010-04-01/Accounts/$SID/Messages.json" \
  --data-urlencode "From=$FROM" \
  --data-urlencode "To=$TO" \
  --data-urlencode "Body=🧪 Test from curl at $(date '+%H:%M:%S'). If you see this, Twilio sandbox works.")

# Extract sid + status from response
MSG_SID=$(echo "$SEND_RESP" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('sid',''))" 2>/dev/null)
STATUS=$(echo "$SEND_RESP" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null)
ERR_CODE=$(echo "$SEND_RESP" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('error_code',''))" 2>/dev/null)
ERR_MSG=$(echo "$SEND_RESP" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('error_message',''))" 2>/dev/null)

if [ -z "$MSG_SID" ]; then
  echo "    ❌ Twilio rejected the request entirely:"
  echo "$SEND_RESP" | head -c 600
  echo
  exit 1
fi

echo "    Message SID:  $MSG_SID"
echo "    Initial status: $STATUS"
[ -n "$ERR_CODE" ] && echo "    Error code:   $ERR_CODE"
[ -n "$ERR_MSG" ] && echo "    Error message: $ERR_MSG"
echo

# Step 2: poll for delivery status
echo "[2/2] Polling delivery status (up to 30s)..."
for i in 1 2 3 4 5 6; do
  sleep 5
  STATUS_RESP=$(curl -s -u "$SID:$TOKEN" \
    "https://api.twilio.com/2010-04-01/Accounts/$SID/Messages/$MSG_SID.json")
  CUR_STATUS=$(echo "$STATUS_RESP" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null)
  CUR_ERR=$(echo "$STATUS_RESP" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('error_code') or '')" 2>/dev/null)
  CUR_ERR_MSG=$(echo "$STATUS_RESP" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('error_message') or '')" 2>/dev/null)
  echo "    [$((i*5))s] status=$CUR_STATUS${CUR_ERR:+  error=$CUR_ERR  $CUR_ERR_MSG}"

  case "$CUR_STATUS" in
    delivered)
      echo
      echo "✅✅ DELIVERED — sandbox works. The issue is in n8n's setup (token/From/To/credential)."
      exit 0
      ;;
    failed|undelivered)
      echo
      echo "❌ Twilio failed to deliver. Error code: $CUR_ERR"
      echo "   Message: $CUR_ERR_MSG"
      echo
      echo "Common codes:"
      echo "   63016  → 24-hour conversation window expired. Send 'hi' to sandbox from your phone, retry."
      echo "   63015  → Recipient hasn't joined sandbox. Send your join code from the phone."
      echo "   21408  → Geographic permission missing on Twilio account."
      echo "   21610  → Recipient blocked Twilio number."
      exit 1
      ;;
  esac
done

echo
echo "⚠️  Still in $CUR_STATUS state after 30s. Check Twilio Messaging Logs:"
echo "   https://console.twilio.com/us1/monitor/logs/sms/$MSG_SID"
