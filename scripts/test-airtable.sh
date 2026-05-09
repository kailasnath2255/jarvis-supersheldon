#!/usr/bin/env bash
# Usage: bash scripts/test-airtable.sh <YOUR_PAT_TOKEN>
# Runs a battery of tests to pinpoint why an Airtable PAT is failing.

TOKEN="${1:-}"
if [ -z "$TOKEN" ]; then
  echo "Usage: bash scripts/test-airtable.sh <YOUR_PAT_TOKEN>"
  exit 1
fi

EXPECTED_BASE="app6o2dh6wgXwGYwr"

echo "═══════════════════════════════════════════════════════"
echo "Airtable PAT diagnostic"
echo "═══════════════════════════════════════════════════════"
echo

# Test 1: Whoami — does the token authenticate at all?
echo "[1/4] Token validity check (whoami):"
WHO_BODY=$(curl -s -H "Authorization: Bearer $TOKEN" "https://api.airtable.com/v0/meta/whoami")
WHO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "https://api.airtable.com/v0/meta/whoami")
echo "    HTTP $WHO_STATUS"
echo "    Body: $WHO_BODY" | head -c 300
echo
if [ "$WHO_STATUS" = "401" ]; then
  echo "    ❌ Token is invalid or revoked."
  exit 1
fi
if [ "$WHO_STATUS" = "200" ]; then
  echo "    ✅ Token authenticates."
fi
echo

# Test 2: List visible bases — needs schema.bases:read
echo "[2/4] Visible bases (needs schema.bases:read):"
BASES_BODY=$(curl -s -H "Authorization: Bearer $TOKEN" "https://api.airtable.com/v0/meta/bases")
BASES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "https://api.airtable.com/v0/meta/bases")
echo "    HTTP $BASES_STATUS"
if [ "$BASES_STATUS" = "200" ]; then
  echo "    Bases this token can see:"
  echo "$BASES_BODY" | python3 -c "
import json, sys
data = json.load(sys.stdin)
bases = data.get('bases', [])
if not bases:
    print('      (NONE — token has no base access)')
for b in bases:
    marker = ' ← EXPECTED' if b['id'] == '$EXPECTED_BASE' else ''
    print(f'      {b[\"id\"]}  {b[\"name\"]}{marker}')
" 2>/dev/null || echo "      (couldn't parse JSON)"
  if echo "$BASES_BODY" | grep -q "$EXPECTED_BASE"; then
    echo "    ✅ Expected base $EXPECTED_BASE is in the access list."
  else
    echo "    ❌ Expected base $EXPECTED_BASE is NOT in the token's access list."
    echo "       Even though Airtable's PAT page shows it, the token wasn't actually saved with that access."
  fi
else
  echo "    ❌ Cannot list bases. Body: $(echo $BASES_BODY | head -c 300)"
  echo "       Token is missing schema.bases:read scope."
fi
echo

# Test 3: Read schema of the expected base — needs schema.bases:read + that base in access
echo "[3/4] Read schema of base $EXPECTED_BASE:"
SCHEMA_STATUS=$(curl -s -o /tmp/at-schema.json -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.airtable.com/v0/meta/bases/$EXPECTED_BASE/tables")
echo "    HTTP $SCHEMA_STATUS"
if [ "$SCHEMA_STATUS" = "200" ]; then
  echo "    Tables found:"
  python3 -c "
import json
d = json.load(open('/tmp/at-schema.json'))
for t in d.get('tables', []):
    print(f'      • {t[\"name\"]}  ({t[\"id\"]})')
" 2>/dev/null || cat /tmp/at-schema.json | head -c 500
  echo "    ✅ Base + schema accessible."
else
  echo "    ❌ Body: $(cat /tmp/at-schema.json | head -c 400)"
fi
echo

# Test 4: Read records from Enrollments
echo "[4/4] Read records from Enrollments:"
READ_STATUS=$(curl -s -o /tmp/at-read.json -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.airtable.com/v0/$EXPECTED_BASE/Enrollments?maxRecords=1")
echo "    HTTP $READ_STATUS"
if [ "$READ_STATUS" = "200" ]; then
  echo "    ✅ Read works. data.records:read is fine."
else
  echo "    ❌ Body: $(cat /tmp/at-read.json | head -c 400)"
  echo "       Token is missing data.records:read scope OR base access."
fi
echo

# Cleanup
rm -f /tmp/at-schema.json /tmp/at-read.json

echo "═══════════════════════════════════════════════════════"
echo "Diagnosis complete. Paste the output above back to chat."
echo "═══════════════════════════════════════════════════════"
