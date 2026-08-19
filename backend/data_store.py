"""JSON collections used by the local MVP."""
from pathlib import Path
import json

DATA_DIR = Path(__file__).resolve().parent / "data"
CONFIG_DIR = DATA_DIR / "config"
COLLECTION_FILES = {
    "users": DATA_DIR / "users.json",
    "landlords": DATA_DIR / "landlords.json",
    "rooms": DATA_DIR / "rooms.json",
    "saved_rooms": DATA_DIR / "saved_rooms.json",
    "rental_requests": DATA_DIR / "rental_requests.json",
    "comments": DATA_DIR / "comments.json",
    "notifications": DATA_DIR / "notifications.json",
}


def _read(path):
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def _write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)


def load_verifications():
    return _read(DATA_DIR / "verifications.json")


def save_verifications(value):
    _write(DATA_DIR / "verifications.json", value)


def load_db():
    return {name: _read(path) for name, path in COLLECTION_FILES.items()}


def save_db(db):
    for name, path in COLLECTION_FILES.items():
        _write(path, db.get(name, []))


def load_filter_options():
    path = CONFIG_DIR / "filter_options.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
