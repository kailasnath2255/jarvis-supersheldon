#!/usr/bin/env bash
# Usage: bash scripts/debug-slots.sh <PAT>
# Inspects the Tutors + AvailableSlots tables to debug why available_tutors is empty.

TOKEN="${1:-}"
BASE="app6o2dh6wgXwGYwr"

if [ -z "$TOKEN" ]; then
  echo "Usage: bash scripts/debug-slots.sh <PAT>"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "Airtable: tutors + slots inspection"
echo "═══════════════════════════════════════════════════════"
echo

echo "[1/3] Tutors table:"
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.airtable.com/v0/$BASE/Tutors?maxRecords=10" \
  | python3 -c "
import json, sys
d = json.load(sys.stdin)
records = d.get('records', [])
print(f'    {len(records)} tutor(s) found')
for r in records:
    f = r.get('fields', {})
    print(f'      • {r[\"id\"]}  name={f.get(\"name\",\"???\")}  email={f.get(\"email\",\"-\")}')
"
echo

echo "[2/3] AvailableSlots table (raw):"
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.airtable.com/v0/$BASE/AvailableSlots?maxRecords=20" \
  | python3 -c "
import json, sys
from datetime import datetime, timezone
d = json.load(sys.stdin)
records = d.get('records', [])
print(f'    {len(records)} slot(s) found')
now = datetime.now(timezone.utc)
linked = 0
unlinked = 0
future = 0
past = 0
booked = 0
for r in records:
    f = r.get('fields', {})
    tutor_link = f.get('tutor', [])
    has_link = bool(tutor_link)
    if has_link: linked += 1
    else: unlinked += 1
    dt_str = f.get('slot_datetime', '')
    is_future = False
    try:
        dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        is_future = dt > now
        if is_future: future += 1
        else: past += 1
    except Exception:
        pass
    if f.get('is_booked'): booked += 1
    print(f'      • {r[\"id\"]}  tutor={tutor_link if tutor_link else \"(EMPTY)\"}  datetime={dt_str}  is_booked={f.get(\"is_booked\", False)}  future={is_future}')
print()
print(f'    Linked to tutor: {linked}/{len(records)}')
print(f'    Unlinked:        {unlinked}/{len(records)}')
print(f'    In the future:   {future}/{len(records)}')
print(f'    In the past:     {past}/{len(records)}')
print(f'    Marked booked:   {booked}/{len(records)}')
"
echo

echo "[3/3] What the n8n filter would return:"
curl -s -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "filterByFormula=AND(NOT({is_booked}), IS_AFTER({slot_datetime}, NOW()))" \
  -G "https://api.airtable.com/v0/$BASE/AvailableSlots?maxRecords=20" \
  | python3 -c "
import json, sys
d = json.load(sys.stdin)
records = d.get('records', [])
print(f'    {len(records)} slot(s) match the n8n filter (NOT booked AND future).')
if not records:
    print('    ⚠️  Zero slots match. That is why available_tutors is empty.')
"

echo
echo "═══════════════════════════════════════════════════════"
echo "Diagnosis complete."
echo "═══════════════════════════════════════════════════════"
