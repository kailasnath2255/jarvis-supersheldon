#!/usr/bin/env bash
# Usage: bash scripts/seed-students.sh <PAT>
# Seeds 30 demo students into the Students table.
# IDs follow the format COUNTRY-NUMBER-NAME, e.g. AUS-7733-Gawin.

TOKEN="${1:-}"
BASE="app6o2dh6wgXwGYwr"

if [ -z "$TOKEN" ]; then
  echo "Usage: bash scripts/seed-students.sh <PAT>"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "Seeding 30 students into $BASE / Students"
echo "═══════════════════════════════════════════════════════"
echo

python3 <<'PYEOF' > /tmp/students-payload.json
import json, random, sys
random.seed(2026)

# 30 students. Distribute across countries.
country_names = {
    "IND": ["Aarav", "Diya", "Ishaan", "Priya", "Rohan", "Saanvi", "Vihaan", "Anaya"],
    "GBR": ["Oliver", "Sophia", "Harry", "Olivia", "Charlie", "Amelia", "Jack", "Isla"],
    "USA": ["Liam", "Emma", "Noah", "Ava", "Brandon", "Mia", "Lucas", "Harper"],
    "AUS": ["Gawin", "Lachlan", "Charlotte", "Ethan", "Ruby", "Cooper", "Mia", "Henry"],
    "NZL": ["Tane", "Aria", "Kahu", "Mahi", "Anika", "Maia"],
    "CAN": ["Owen", "Emily", "Logan", "Zoe", "Carter"]
}
subjects_all = ["Maths","English","Science","Coding","Public Speaking","Reasoning","Chess"]
grades = [f"Grade {n}" for n in range(1, 13)]
tutors = ["Priya Iyer", "Anand Kumar", "Meera Nair", "Aanya Sharma", "Rohan Mehta", "(none)"]

records = []
used_ids = set()
distribution = [
    ("IND", 8),
    ("GBR", 6),
    ("USA", 6),
    ("AUS", 5),
    ("NZL", 3),
    ("CAN", 2),
]

for country, n in distribution:
    for _ in range(n):
        # build unique ID
        for _attempt in range(20):
            name = random.choice(country_names[country])
            num = random.randint(1000, 9999)
            sid = f"{country}-{num}-{name}"
            if sid not in used_ids:
                used_ids.add(sid)
                break
        else:
            continue

        # build other fields
        age = random.randint(8, 17)
        grade = grades[max(0, min(11, age - 6))]  # rough mapping
        n_subjects = random.randint(1, 3)
        interested = random.sample(subjects_all, n_subjects)
        first_name = name
        parent_name = f"{random.choice(['Mr.','Ms.','Mrs.'])} {random.choice(['Sharma','Iyer','Patel','Banerjee','Smith','Johnson','Walker','Brown','Tane','Ngata','Singh'])}"
        parent_email_local = first_name.lower() + ".parent"
        domain = {
            "IND": "example.in",
            "GBR": "example.co.uk",
            "USA": "example.com",
            "AUS": "example.com.au",
            "NZL": "example.co.nz",
            "CAN": "example.ca",
        }[country]
        # phone country codes
        cc = {
            "IND": "+91",
            "GBR": "+44",
            "USA": "+1",
            "AUS": "+61",
            "NZL": "+64",
            "CAN": "+1",
        }[country]
        phone = cc + "".join(str(random.randint(0,9)) for _ in range(9 if country == "IND" else 10))

        demo_completed = random.random() < 0.65
        demo_tutor = random.choice(tutors[:-1]) if demo_completed else ""
        demo_date = ""
        if demo_completed:
            # within last 30 days
            from datetime import datetime, timedelta
            d = datetime.utcnow().date() - timedelta(days=random.randint(0, 30))
            demo_date = d.isoformat()

        notes_pool = [
            "Loves group activities, struggles with shyness.",
            "Strong in arithmetic, weak in word problems.",
            "Wants to compete at school olympiad.",
            "Prefers visual learning. Use diagrams.",
            "Bilingual home (Hindi + English).",
            "Has done coding club at school.",
            "Asked specifically for evening slots.",
            "",
        ]
        notes = random.choice(notes_pool)

        records.append({
            "fields": {
                "student_id": sid,
                "name": name,
                "country": country,
                "age": age,
                "grade": grade,
                "parent_name": parent_name,
                "parent_email": f"{parent_email_local}@{domain}",
                "parent_whatsapp": phone,
                "interested_in": interested,
                "demo_completed": demo_completed,
                "demo_tutor": demo_tutor,
                "demo_date": demo_date,
                "notes": notes
            }
        })

print(json.dumps({"records": records}))
PYEOF

echo "[1/1] Creating students in batches of 10..."
ALL_PAYLOAD=$(cat /tmp/students-payload.json)
TOTAL=$(echo "$ALL_PAYLOAD" | python3 -c "import json,sys; print(len(json.load(sys.stdin)['records']))")
echo "    Total to insert: $TOTAL"

CREATED=0
i=0
while [ $i -lt $TOTAL ]; do
  BATCH=$(echo "$ALL_PAYLOAD" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(json.dumps({'records': d['records'][$i:$i+10], 'typecast': True}))
")
  RESP=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BATCH" \
    "https://api.airtable.com/v0/$BASE/Students")

  COUNT=$(echo "$RESP" | python3 -c "import json,sys
try:
  d = json.load(sys.stdin)
  recs = d.get('records', [])
  for r in recs:
    f = r.get('fields', {})
    print(f\"      ✅ {f.get('student_id', r['id'])}\")
  print('BATCH_COUNT:' + str(len(recs)))
except Exception as e:
  print('ERROR: ' + str(e), file=sys.stderr)
" 2>&1)

  if echo "$COUNT" | grep -q "ERROR"; then
    echo "    ❌ Batch at offset $i failed:"
    echo "    $(echo $RESP | head -c 400)"
    exit 1
  fi

  echo "$COUNT" | grep -v "BATCH_COUNT:"
  BC=$(echo "$COUNT" | grep "BATCH_COUNT:" | sed 's/BATCH_COUNT://')
  CREATED=$((CREATED + BC))
  i=$((i + 10))
done

echo
echo "═══════════════════════════════════════════════════════"
echo "✅ Created $CREATED students."
echo "═══════════════════════════════════════════════════════"

rm -f /tmp/students-payload.json
