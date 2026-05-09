#!/usr/bin/env bash
# Usage: bash scripts/seed-tutors.sh <PAT>
# Adds 30 tutors + 5 future slots each (150 slots) to the Sheldon Sales Pipeline base.

TOKEN="${1:-}"
BASE="app6o2dh6wgXwGYwr"

if [ -z "$TOKEN" ]; then
  echo "Usage: bash scripts/seed-tutors.sh <PAT>"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "Seeding 30 tutors + slots into $BASE"
echo "═══════════════════════════════════════════════════════"
echo

python3 <<'PYEOF' > /tmp/tutors-payload.json
import json, random, sys
random.seed(2026)

first_names = [
    "Aanya","Aditya","Akira","Ananya","Arjun","Aryan","Avani","Diya","Esha","Ishaan",
    "Kabir","Kavya","Krish","Lakshmi","Maya","Neha","Nikhil","Pooja","Rahul","Riya",
    "Rohan","Saanvi","Samar","Shreya","Siddharth","Tanya","Varun","Vivaan","Yash","Zara"
]
last_names = [
    "Agarwal","Banerjee","Chatterjee","Desai","Gupta","Iyer","Joshi","Kapoor","Khanna","Kumar",
    "Malhotra","Mehra","Menon","Mukherjee","Nair","Patel","Pillai","Rao","Reddy","Saxena",
    "Sengupta","Sharma","Shenoy","Singh","Sinha","Subramanian","Trivedi","Varma","Verma","Yadav"
]
all_subjects = ["Maths","English","Science","Coding","Public Speaking","Reasoning","Chess"]
bios = [
    "10+ years tutoring kids in metro cities. Loves making hard topics fun.",
    "Olympiad-level coach. Patient with younger learners.",
    "Ex-banker turned full-time educator. Practical, story-led teaching.",
    "Soft-spoken; great with shy children. Uses lots of visuals.",
    "Engineering grad, plays chess in spare time.",
    "Former school topper. Now helps students think instead of memorize.",
    "Bilingual instructor (English + Hindi). Calm and structured.",
    "Built India's youngest debate club. Public speaking specialist.",
    "Loves robotics and Scratch. Coding made playful.",
    "Yoga teacher on weekends; brings mindfulness into class."
]

records = []
used_pairs = set()
for i in range(30):
    while True:
        first = random.choice(first_names)
        last = random.choice(last_names)
        if (first, last) not in used_pairs: break
    used_pairs.add((first, last))

    name = f"{first} {last}"
    email = f"{first.lower()}.{last.lower()}@supersheldon.demo"
    phone = "+91" + "".join(str(random.randint(0,9)) for _ in range(10))

    n_subjects = random.randint(1, 3)
    subjects = random.sample(all_subjects, n_subjects)
    bio = random.choice(bios)

    records.append({
        "fields": {
            "name": name,
            "email": email,
            "phone": phone,
            "subjects": subjects,
            "bio": bio
        }
    })

print(json.dumps({"records": records, "typecast": True}))
PYEOF

# Step 1: create tutors in batches of 10 (Airtable max per request)
echo "[1/2] Creating 30 tutors..."
TUTORS_PAYLOAD=$(cat /tmp/tutors-payload.json)
CREATED_IDS_FILE=/tmp/created-tutor-ids.txt
> $CREATED_IDS_FILE

for batch_start in 0 10 20; do
    batch_payload=$(echo "$TUTORS_PAYLOAD" | python3 -c "
import json, sys
d = json.load(sys.stdin)
batch = d['records'][$batch_start:$batch_start + 10]
print(json.dumps({'records': batch, 'typecast': True}))
")
    RESP=$(curl -s -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$batch_payload" \
        "https://api.airtable.com/v0/$BASE/Tutors")

    BATCH_IDS=$(echo "$RESP" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    if 'records' in d:
        for r in d['records']:
            print(f\"{r['id']}|{r.get('fields', {}).get('name', '')}\")
    else:
        print('ERROR:' + str(d), file=sys.stderr)
except Exception as e:
    print(f'PARSE_ERROR: {e}', file=sys.stderr)
")

    if [ -z "$BATCH_IDS" ]; then
        echo "    ❌ Batch starting at $batch_start failed:"
        echo "    $(echo $RESP | head -c 500)"
        exit 1
    fi
    echo "$BATCH_IDS" >> $CREATED_IDS_FILE
    BATCH_COUNT=$(echo "$BATCH_IDS" | wc -l | tr -d ' ')
    echo "    ✅ Batch $((batch_start/10 + 1)): created $BATCH_COUNT tutors"
done

TOTAL_CREATED=$(wc -l < $CREATED_IDS_FILE | tr -d ' ')
echo "    Total: $TOTAL_CREATED new tutors"
echo

# Step 2: create 5 future slots per tutor
echo "[2/2] Creating 150 future slots (5 per tutor)..."

# Build slot payloads in batches of 10
python3 <<PYEOF > /tmp/slots-payload-script.py
import json
from datetime import datetime, timedelta, timezone

ist = timezone(timedelta(hours=5, minutes=30))
now = datetime.now(ist).replace(microsecond=0, second=0, minute=0)
# Start from tomorrow
start = (now + timedelta(days=1)).replace(hour=0)

# Read tutor IDs
with open("$CREATED_IDS_FILE") as f:
    tutor_ids = [line.strip().split("|")[0] for line in f if line.strip()]

times = [(16, 0), (17, 30), (18, 0), (19, 0), (10, 0), (11, 0), (12, 0)]
all_records = []
import random
random.seed(2026)

for ti, tid in enumerate(tutor_ids):
    used_times = set()
    for s in range(5):
        # pick a future date within next 14 days, with a varied time
        day_offset = (ti + s) % 14
        time_idx = (ti * 7 + s) % len(times)
        h, m = times[time_idx]
        slot_local = (start + timedelta(days=day_offset)).replace(hour=h, minute=m)
        slot_utc = slot_local.astimezone(timezone.utc)
        key = (day_offset, h, m, tid)
        if key in used_times:
            continue
        used_times.add(key)
        all_records.append({
            "fields": {
                "tutor": [tid],
                "slot_datetime": slot_utc.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                "is_booked": False
            }
        })

# write batches of 10
import json
print(json.dumps(all_records))
PYEOF

ALL_SLOTS=$(python3 /tmp/slots-payload-script.py)
TOTAL_SLOTS=$(echo "$ALL_SLOTS" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
echo "    Generated $TOTAL_SLOTS slot records to insert..."

CREATED_SLOTS=0
i=0
while [ $i -lt $TOTAL_SLOTS ]; do
    BATCH_PAYLOAD=$(echo "$ALL_SLOTS" | python3 -c "
import json, sys
data = json.load(sys.stdin)
batch = data[$i:$i + 10]
print(json.dumps({'records': batch, 'typecast': True}))
")
    RESP=$(curl -s -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$BATCH_PAYLOAD" \
        "https://api.airtable.com/v0/$BASE/AvailableSlots")

    BATCH_OK=$(echo "$RESP" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(len(d.get('records', [])))
except: print(0)
")
    if [ "$BATCH_OK" = "0" ]; then
        echo "    ❌ Batch at offset $i failed: $(echo $RESP | head -c 300)"
        break
    fi
    CREATED_SLOTS=$((CREATED_SLOTS + BATCH_OK))
    echo "    ... $CREATED_SLOTS / $TOTAL_SLOTS slots created"
    i=$((i + 10))
done

echo
echo "═══════════════════════════════════════════════════════"
echo "✅ Seed complete: $TOTAL_CREATED tutors + $CREATED_SLOTS slots added."
echo "Refresh your parent page — should see 33 tutors with slots."
echo "═══════════════════════════════════════════════════════"

# cleanup
rm -f /tmp/tutors-payload.json /tmp/created-tutor-ids.txt /tmp/slots-payload-script.py
