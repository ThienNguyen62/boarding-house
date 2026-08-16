from pathlib import Path
import json
from data_store import COLLECTION_FILES

legacy = Path(__file__).resolve().parents[1] / "data" / "db.json"
if not legacy.exists():
    raise SystemExit("Không tìm thấy backend/data/db.json để migrate.")

db = json.loads(legacy.read_text(encoding="utf-8"))
for name, path in COLLECTION_FILES.items():
    path.write_text(json.dumps(db.get(name, []), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Migrated {name} -> {path.name}")
