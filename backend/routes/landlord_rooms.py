from flask import Blueprint, jsonify, request
from common import current_user, enrich_room, require_landlord
from data_store import load_db

bp = Blueprint("landlord_rooms", __name__, url_prefix="/api/my")


@bp.get("/rooms")
@require_landlord
def my_rooms():
    user = current_user()
    db = load_db()
    include_hidden = request.args.get("includeHidden", "false").lower() == "true"
    rooms = [r for r in db.get("rooms", []) if r.get("owner_user_id") == user["id"]]
    if not include_hidden:
        rooms = [r for r in rooms if r.get("status", "active") != "hidden"]
    rooms.sort(key=lambda r: r.get("posted_at", ""), reverse=True)
    return jsonify({"data": [enrich_room(r, db) for r in rooms]})
