from datetime import datetime
from pathlib import Path
from flask import Blueprint, jsonify, request

from common import current_user, enrich_room, next_id, require_landlord
from data_store import load_db, save_db

bp = Blueprint("rooms", __name__, url_prefix="/api/rooms")


def make_room(data, room_id, user, db, old=None):
    def s(name, default=""):
        return str(data.get(name, default)).strip()

    title, description, address = s("title"), s("description"), s("address")
    if not title or not description or not address:
        raise ValueError("Tên, mô tả và địa chỉ là bắt buộc")
    try:
        price = int(float(data.get("price", 0)))
        area = float(data.get("area", 0))
        lat = float(data.get("latitude", 21.0285))
        lng = float(data.get("longitude", 105.8542))
    except (TypeError, ValueError):
        raise ValueError("Giá, diện tích và tọa độ phải là số")
    amenities = data.get("amenities", [])
    if isinstance(amenities, str):
        amenities = [x.strip() for x in amenities.split(",") if x.strip()]
    landlord_id = (old or {}).get("landlord_id") or user.get("landlord_profile_id")
    if not landlord_id:
        landlord_id = next((l.get("id") for l in db.get("landlords", []) if l.get("user_id") == user.get("id")), None)
    if not landlord_id:
        raise ValueError("Không tìm thấy hồ sơ chủ trọ")
    return {
        "id": room_id, "title": title, "description": description, "price": price,
        "area": area, "deposit": data.get("deposit", price), "electricity": data.get("electricity", 4000),
        "water": data.get("water", 30000), "service_fee": data.get("service_fee", 100000),
        "available_from": s("available_from"), "address": address, "district": s("district"),
        "ward": s("ward"), "city": s("city", "Hà Nội"), "latitude": lat, "longitude": lng,
        "type": s("type", "Phòng trọ"), "gender": s("gender", "Tất cả"),
        "furnished": bool(data.get("furnished", False)), "amenities": amenities,
        "nearby": (old or {}).get("nearby", []),
        "image": s("image") or (old or {}).get("image") or "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
        "landlord_id": landlord_id, "owner_user_id": user["id"],
        "verified": (old or {}).get("verified", False), "views": (old or {}).get("views", 0),
        "rating": (old or {}).get("rating", 0), "posted_at": (old or {}).get("posted_at") or datetime.now().strftime("%Y-%m-%d"),
        "status": (old or {}).get("status", "active")
    }


@bp.get("")
def get_rooms():
    db = load_db()
    rooms = [r for r in db.get("rooms", []) if r.get("status", "active") != "hidden"]
    keyword = request.args.get("keyword", "").strip().lower()
    district = request.args.get("district", "").strip()
    rtype = request.args.get("type", "").strip()
    max_price = request.args.get("maxPrice", "").strip()
    min_area = request.args.get("minArea", "").strip()

    def text(room):
        fields = [room.get("title", ""), room.get("description", ""), room.get("address", ""), room.get("district", ""), room.get("ward", ""), room.get("city", ""), room.get("type", "")]
        fields += room.get("amenities", []) or []
        fields += room.get("nearby", []) or []
        return " ".join(map(str, fields)).lower()

    if keyword:
        rooms = [r for r in rooms if keyword in text(r)]
    if district:
        rooms = [r for r in rooms if r.get("district") == district]
    if rtype:
        rooms = [r for r in rooms if r.get("type") == rtype]
    if max_price:
        try:
            rooms = [r for r in rooms if float(r.get("price", 0)) <= float(max_price)]
        except ValueError:
            pass
    if min_area:
        try:
            rooms = [r for r in rooms if float(r.get("area", 0)) >= float(min_area)]
        except ValueError:
            pass
    return jsonify({"data": [enrich_room(r, db) for r in rooms]})


@bp.get("/<room_id>")
def get_room(room_id):
    db = load_db()
    room = next((r for r in db.get("rooms", []) if r.get("id") == room_id and r.get("status", "active") != "hidden"), None)
    if not room:
        return jsonify({"error": "NOT_FOUND", "message": "Không tìm thấy phòng"}), 404
    return jsonify({"data": enrich_room(room, db)})


@bp.get("/<room_id>/comments-count")
def comments_count(room_id):
    db = load_db()
    count = sum(1 for c in db.get("comments", []) if c.get("room_id") == room_id)
    return jsonify({"data": count})


@bp.get("/my")
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


@bp.post("")
@require_landlord
def create_room():
    user = current_user()
    data = request.get_json(silent=True) or {}
    db = load_db()
    room_id = next_id("RNEW", db.get("rooms", []))
    try:
        room = make_room(data, room_id, user, db)
    except ValueError as exc:
        return jsonify({"error": "VALIDATION", "message": str(exc)}), 400
    db.setdefault("rooms", []).append(room)
    save_db(db)
    return jsonify({"data": enrich_room(room, db)}), 201


@bp.put("/<room_id>")
@require_landlord
def update_room(room_id):
    user = current_user()
    db = load_db()
    old = next((r for r in db.get("rooms", []) if r.get("id") == room_id), None)
    if not old:
        return jsonify({"error": "NOT_FOUND", "message": "Không tìm thấy tin"}), 404
    if old.get("owner_user_id") != user["id"]:
        return jsonify({"error": "FORBIDDEN", "message": "Bạn không có quyền sửa tin này"}), 403
    try:
        updated = make_room(request.get_json(silent=True) or {}, room_id, user, db, old=old)
    except ValueError as exc:
        return jsonify({"error": "VALIDATION", "message": str(exc)}), 400
    index = db["rooms"].index(old)
    db["rooms"][index] = updated
    save_db(db)
    return jsonify({"data": enrich_room(updated, db)})


@bp.put("/<room_id>/status")
@require_landlord
def update_room_status(room_id):
    user = current_user()
    db = load_db()
    room = next((r for r in db.get("rooms", []) if r.get("id") == room_id), None)
    if not room:
        return jsonify({"error": "NOT_FOUND", "message": "Không tìm thấy tin"}), 404
    if room.get("owner_user_id") != user["id"]:
        return jsonify({"error": "FORBIDDEN", "message": "Bạn không có quyền cập nhật tin này"}), 403
    status = str((request.get_json(silent=True) or {}).get("status", "")).strip()
    if status not in ("active", "hidden"):
        return jsonify({"error": "VALIDATION", "message": "Trạng thái không hợp lệ"}), 400
    room["status"] = status
    save_db(db)
    return jsonify({"data": enrich_room(room, db)})


@bp.delete("/<room_id>")
@require_landlord
def delete_room(room_id):
    user = current_user()
    db = load_db()
    room = next((r for r in db.get("rooms", []) if r.get("id") == room_id), None)
    if not room:
        return jsonify({"error": "NOT_FOUND", "message": "Không tìm thấy tin"}), 404
    if room.get("owner_user_id") != user["id"]:
        return jsonify({"error": "FORBIDDEN", "message": "Bạn không có quyền xoá tin này"}), 403
    room["status"] = "hidden"
    save_db(db)
    return jsonify({"data": True})
