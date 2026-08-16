from flask import Blueprint, jsonify
from common import active_room, current_user, enrich_room, require_tenant
from data_store import load_db, save_db
from datetime import datetime

bp = Blueprint("saved", __name__, url_prefix="/api/saved")


@bp.get("")
@require_tenant
def get_saved():
    user = current_user(); db = load_db()
    room_ids = [x.get("room_id") for x in db.get("saved_rooms", []) if x.get("user_id") == user["id"]]
    rooms = [enrich_room(r, db) for r in db.get("rooms", []) if r.get("id") in room_ids and r.get("status", "active") != "hidden"]
    return jsonify({"data": rooms, "room_ids": room_ids})


@bp.post("/<room_id>")
@require_tenant
def save_room(room_id):
    user = current_user(); db = load_db()
    if not active_room(db, room_id):
        return jsonify({"error": "NOT_FOUND", "message": "Phòng không tồn tại hoặc đã ẩn"}), 404
    db.setdefault("saved_rooms", [])
    if not any(x.get("user_id") == user["id"] and x.get("room_id") == room_id for x in db["saved_rooms"]):
        db["saved_rooms"].append({"user_id": user["id"], "room_id": room_id, "created_at": datetime.now().isoformat(timespec="seconds")})
        save_db(db)
    return jsonify({"data": True})


@bp.delete("/<room_id>")
@require_tenant
def unsave_room(room_id):
    user = current_user(); db = load_db()
    db["saved_rooms"] = [x for x in db.get("saved_rooms", []) if not (x.get("user_id") == user["id"] and x.get("room_id") == room_id)]
    save_db(db)
    return jsonify({"data": True})
