from flask import Blueprint, jsonify, request
from common import active_room, current_user, next_id, require_landlord, require_tenant, now_iso
from data_store import load_db, save_db

bp = Blueprint("requests", __name__, url_prefix="/api/requests")


@bp.post("")
@require_tenant
def create_request():
    user = current_user(); data = request.get_json(silent=True) or {}; room_id = str(data.get("room_id", "")).strip(); message = str(data.get("message", "")).strip()
    db = load_db(); room = active_room(db, room_id)
    if not room: return jsonify({"error": "NOT_FOUND", "message": "Phòng không tồn tại hoặc đã ẩn"}), 404
    pending = next((x for x in db.get("rental_requests", []) if x.get("tenant_id") == user["id"] and x.get("room_id") == room_id and x.get("status") in ("pending", "contacted")), None)
    if pending: return jsonify({"error": "DUPLICATE_REQUEST", "message": "Bạn đã gửi yêu cầu cho phòng này"}), 409
    landlord = next((x for x in db.get("landlords", []) if x.get("id") == room.get("landlord_id")), {})
    req = {
        "id": next_id("REQ", db.get("rental_requests", [])), "tenant_id": user["id"], "tenant_name": user.get("name", ""),
        "tenant_email": user.get("email", ""), "landlord_id": room.get("landlord_id"), "landlord_user_id": landlord.get("user_id"),
        "room_id": room_id, "room_title": room.get("title", ""),
        "message": message or "Tôi quan tâm đến phòng này và muốn được liên hệ.", "status": "pending", "created_at": now_iso()
    }
    db.setdefault("rental_requests", []).append(req); save_db(db)
    return jsonify({"data": req}), 201


@bp.get("/mine")
@require_tenant
def my_requests():
    user = current_user(); db = load_db()
    items = [x for x in db.get("rental_requests", []) if x.get("tenant_id") == user["id"]]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"data": items})


@bp.get("/landlord")
@require_landlord
def landlord_requests():
    user = current_user(); db = load_db()
    items = [x for x in db.get("rental_requests", []) if x.get("landlord_user_id") == user["id"]]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"data": items})


@bp.put("/<request_id>")
@require_landlord
def update_request(request_id):
    user = current_user(); db = load_db(); item = next((x for x in db.get("rental_requests", []) if x.get("id") == request_id), None)
    if not item: return jsonify({"error": "NOT_FOUND", "message": "Không tìm thấy yêu cầu"}), 404
    if item.get("landlord_user_id") != user["id"]: return jsonify({"error": "FORBIDDEN", "message": "Bạn không có quyền cập nhật yêu cầu này"}), 403
    status = str((request.get_json(silent=True) or {}).get("status", "")).strip()
    if status not in ("pending", "contacted", "rejected"): return jsonify({"error": "VALIDATION", "message": "Trạng thái không hợp lệ"}), 400
    item["status"] = status; item["updated_at"] = now_iso(); save_db(db)
    return jsonify({"data": item})
