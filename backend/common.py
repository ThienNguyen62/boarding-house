import hashlib
import uuid
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import jsonify, session

from data_store import load_db

BASE = Path(__file__).resolve().parent.parent
FRONTEND = BASE / "frontend"


def hash_pw(password):
    return hashlib.sha256(("trosmart-mvp" + password).encode()).hexdigest()


def public_user(user):
    return {k: user.get(k, "") for k in ["id", "email", "name", "role", "avatar"]}


def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    db = load_db()
    return next((u for u in db.get("users", []) if u.get("id") == uid), None)


def require_login(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user():
            return jsonify({"error": "UNAUTHORIZED", "message": "Vui lòng đăng nhập"}), 401
        return fn(*args, **kwargs)
    return wrapper


def require_role(role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user:
                return jsonify({"error": "UNAUTHORIZED", "message": "Vui lòng đăng nhập"}), 401
            if user.get("role") != role:
                return jsonify({"error": "FORBIDDEN", "message": "Bạn không có quyền thực hiện thao tác này"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


require_landlord = require_role("landlord")
require_tenant = require_role("tenant")


def active_room(db, room_id):
    return next(
        (room for room in db.get("rooms", []) if room.get("id") == room_id and room.get("status", "active") != "hidden"),
        None,
    )


def enrich_room(room, db):
    result = dict(room)
    landlord = next((l for l in db.get("landlords", []) if l.get("id") == room.get("landlord_id")), {})
    result["landlord"] = landlord
    result["comments_count"] = sum(1 for c in db.get("comments", []) if c.get("room_id") == room.get("id"))
    result.pop("owner_user_id", None)
    return result


def next_id(prefix, collection, width=3):
    existing = {str(item.get("id", "")) for item in collection}
    index = 1
    while f"{prefix}{index:0{width}d}" in existing:
        index += 1
    return f"{prefix}{index:0{width}d}"


def now_iso():
    return datetime.now().isoformat(timespec="seconds")
