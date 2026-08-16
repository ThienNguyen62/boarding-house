from flask import Blueprint, jsonify, request
from common import current_user, require_login, now_iso
from data_store import load_db, save_db

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def unread_count(items, uid):
    return sum(1 for item in items if item.get("user_id") == uid and not item.get("read"))


@bp.get("")
@require_login
def list_notifications():
    user = current_user(); db = load_db()
    items = [dict(x) for x in db.get("notifications", []) if x.get("user_id") == user["id"]]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"data": items, "unread": unread_count(items, user["id"])})


@bp.put("/<notification_id>/read")
@require_login
def read_notification(notification_id):
    user = current_user(); db = load_db()
    item = next((x for x in db.get("notifications", []) if x.get("id") == notification_id and x.get("user_id") == user["id"]), None)
    if not item: return jsonify({"error": "NOT_FOUND", "message": "Không tìm thấy thông báo"}), 404
    item["read"] = True; item["read_at"] = now_iso(); save_db(db)
    return jsonify({"data": item})


@bp.put("/read-all")
@require_login
def read_all():
    user = current_user(); db = load_db()
    changed = False
    for item in db.get("notifications", []):
        if item.get("user_id") == user["id"] and not item.get("read"):
            item["read"] = True; item["read_at"] = now_iso(); changed = True
    if changed: save_db(db)
    return jsonify({"data": True})
