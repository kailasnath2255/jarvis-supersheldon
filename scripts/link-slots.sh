#!/usr/bin/env bash
# Usage: bash scripts/link-slots.sh <PAT>
# Links every unlinked future slot in AvailableSlots to one of 3 main tutors,
# rotating round-robin: Priya Iyer, Anand Kumar, Meera Nair.

TOKEN="${1:-}"
BASE="app6o2dh6wgXwGYwr"

if [ -z "$TOKEN" ]; then
  echo "Usage: bash scripts/link-slots.sh <PAT>"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "Auto-link unlinked slots to tutors"
echo "═══════════════════════════════════════════════════════"
echo

# Step 1: find the 3 tutor record IDs by name
echo "[1/3] Finding tutor IDs..."
TUTORS_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.airtable.com/v0/$BASE/Tutors?maxRecords=50")

PRIYA_ID=$(echo "$TUTORS_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); ids=[r['id'] for r in d.get('records',[]) if r.get('fields',{}).get('name')=='Priya Iyer']; print(ids[0] if ids else '')")
ANAND_ID=$(echo "$TUTORS_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); ids=[r['id'] for r in d.get('records',[]) if r.get('fields',{}).get('name')=='Anand Kumar']; print(ids[0] if ids else '')")
MEERA_ID=$(echo "$TUTORS_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); ids=[r['id'] for r in d.get('records',[]) if r.get('fields',{}).get('name')=='Meera Nair']; print(ids[0] if ids else '')")

echo "    Priya Iyer:  $PRIYA_ID"
echo "    Anand Kumar: $ANAND_ID"
echo "    Meera Nair:  $MEERA_ID"

if [ -z "$PRIYA_ID" ] || [ -z "$ANAND_ID" ] || [ -z "$MEERA_ID" ]; then
  echo "    ❌ Couldn't find one of the tutors. Check Tutors table for exact names."
  exit 1
fi
echo

# Step 2: find unlinked future slots
echo "[2/3] Finding unlinked future slots..."
SLOTS_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "filterByFormula=AND({tutor}='', IS_AFTER({slot_datetime}, NOW()))" \
  -G "https://api.airtable.com/v0/$BASE/AvailableSlots?maxRecords=100")

SLOT_IDS=$(echo "$SLOTS_JSON" | python3 -c "
import json, sys
d = json.load(sys.stdin)
for r in d.get('records', []):
    print(r['id'])
")

count=$(echo "$SLOT_IDS" | grep -c "rec" || echo 0)
echo "    $count unlinked future slot(s) found."
if [ "$count" -eq "0" ]; then
  echo "    Nothing to link. Done."
  exit 0
fi
echo

# Step 3: distribute slots across the 3 tutors round-robin
echo "[3/3] Linking each slot to a tutor..."
i=0
TUTORS=("$PRIYA_ID" "$ANAND_ID" "$MEERA_ID")
TUTOR_NAMES=("Priya Iyer" "Anand Kumar" "Meera Nair")

while IFS= read -r SLOT_ID; do
  [ -z "$SLOT_ID" ] && continue
  TUTOR_INDEX=$((i % 3))
  TUTOR_ID="${TUTORS[$TUTOR_INDEX]}"
  TUTOR_NAME="${TUTOR_NAMES[$TUTOR_INDEX]}"

  RESP=$(curl -s -X PATCH \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"fields\":{\"tutor\":[\"$TUTOR_ID\"]}}" \
    "https://api.airtable.com/v0/$BASE/AvailableSlots/$SLOT_ID")

  ok=$(echo "$RESP" | python3 -c "import json,sys; print('1' if 'id' in json.load(sys.stdin) else '0')" 2>/dev/null)
  if [ "$ok" = "1" ]; then
    echo "    ✅ $SLOT_ID → $TUTOR_NAME"
  else
    echo "    ❌ $SLOT_ID failed: $(echo $RESP | head -c 200)"
  fi
  i=$((i + 1))
done <<< "$SLOT_IDS"

echo
echo "═══════════════════════════════════════════════════════"
echo "Done. Re-run debug-slots.sh to verify, then test the parent page."
echo "═══════════════════════════════════════════════════════"
