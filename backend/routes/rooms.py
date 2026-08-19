from datetime import datetime
from pathlib import Path
import math
import re
from flask import Blueprint, jsonify, request

from common import current_user, enrich_room, next_id, require_landlord
from data_store import load_db, save_db, load_filter_options

bp = Blueprint("rooms", __name__, url_prefix="/api/rooms")


def haversine_km(lat1, lon1, lat2, lon2):
    radius = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return radius * (2 * math.asin(math.sqrt(a)))


def selected_search_location(search_place):
    options = load_filter_options()
    return next((item for item in options.get("fixed_locations", []) if item.get("id") == search_place), None)


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
        "furnished": bool(data.get("furnished", False)), "furnishing": s("furnishing", "Cơ bản"),
        "private_toilet": bool(data.get("private_toilet", True)), "balcony": bool(data.get("balcony", False)),
        "parking": bool(data.get("parking", False)), "air_conditioning": bool(data.get("air_conditioning", False)),
        "hot_water": bool(data.get("hot_water", False)), "kitchen": bool(data.get("kitchen", False)),
        "security": bool(data.get("security", False)), "bedrooms": int(data.get("bedrooms", 0) or 0),
        "bathrooms": int(data.get("bathrooms", 1) or 1), "floor": int(data.get("floor", 1) or 1),
        "max_occupants": int(data.get("max_occupants", 2) or 2), "amenities": amenities,
        "nearby": (old or {}).get("nearby", []),
        "image": s("image") or (old or {}).get("image") or "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
        "landlord_id": landlord_id, "owner_user_id": user["id"],
        "verified": bool((old or {}).get("verified", False)),
        "verified_at": (old or {}).get("verified_at"),
        "verification_note": (old or {}).get("verification_note", ""),
        "verification_contact": (old or {}).get("verification_contact", ""),
        "views": (old or {}).get("views", 0),
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
    max_area = request.args.get("maxArea", "").strip()
    min_price = request.args.get("minPrice", "").strip()
    ward = request.args.get("ward", "").strip()
    furnishing = request.args.get("furnishing", "").strip()
    gender = request.args.get("gender", "").strip()
    private_toilet = request.args.get("privateToilet", "").strip()
    balcony = request.args.get("balcony", "").strip()
    parking = request.args.get("parking", "").strip()
    amenity = request.args.get("amenity", "").strip().lower()
    verified = request.args.get("verified", "").strip().lower()
    search_place = request.args.get("searchPlace", "").strip()
    radius_km_raw = request.args.get("radiusKm", "").strip()
    sort = request.args.get("sort", "newest").strip()

    def text(room):
        fields = [room.get("title", ""), room.get("description", ""), room.get("address", ""), room.get("district", ""), room.get("ward", ""), room.get("city", ""), room.get("type", "")]
        fields += room.get("amenities", []) or []
        fields += room.get("nearby", []) or []
        return " ".join(map(str, fields)).lower()

    if keyword:
        rooms = [r for r in rooms if keyword in text(r)]
    if district:
        rooms = [r for r in rooms if r.get("district") == district]
    if ward:
        rooms = [r for r in rooms if r.get("ward") == ward]
    if rtype:
        rooms = [r for r in rooms if r.get("type") == rtype]
    if min_price:
        try:
            rooms = [r for r in rooms if float(r.get("price", 0)) >= float(min_price)]
        except ValueError:
            pass
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
    if max_area:
        try:
            rooms = [r for r in rooms if float(r.get("area", 0)) <= float(max_area)]
        except ValueError:
            pass
    if furnishing:
        rooms = [r for r in rooms if r.get("furnishing") == furnishing]
    if gender:
        rooms = [r for r in rooms if r.get("gender") in (gender, "Tất cả")]
    for field, raw in (("private_toilet", private_toilet), ("balcony", balcony), ("parking", parking)):
        if raw.lower() == "true":
            rooms = [r for r in rooms if bool(r.get(field))]
    if amenity:
        if amenity == "camera":
            rooms = [r for r in rooms if r.get("security") or any("camera" in str(a).lower() for a in r.get("amenities", []))]
        else:
            rooms = [r for r in rooms if any(amenity in str(a).lower() for a in r.get("amenities", []))]
    if verified in ("true", "false"):
        wanted = verified == "true"
        rooms = [r for r in rooms if bool(r.get("verified", False)) is wanted]

    search_location = selected_search_location(search_place) if search_place else None
    radius_km = None
    if search_location:
        try:
            radius_km = float(radius_km_raw) if radius_km_raw else 2.0
        except ValueError:
            radius_km = 2.0
        radius_km = max(0.1, min(radius_km, 50.0))
        center_lat = float(search_location.get("latitude"))
        center_lng = float(search_location.get("longitude"))
        filtered = []
        for room in rooms:
            try:
                distance = haversine_km(center_lat, center_lng, float(room.get("latitude")), float(room.get("longitude")))
            except (TypeError, ValueError):
                continue
            if distance <= radius_km:
                copy_room = dict(room)
                copy_room["_search_distance_km"] = round(distance, 2)
                filtered.append(copy_room)
        rooms = filtered

    if sort == "price_asc":
        rooms.sort(key=lambda r: float(r.get("price", 0)))
    elif sort == "price_desc":
        rooms.sort(key=lambda r: float(r.get("price", 0)), reverse=True)
    elif sort == "area_desc":
        rooms.sort(key=lambda r: float(r.get("area", 0)), reverse=True)
    else:
        rooms.sort(key=lambda r: str(r.get("posted_at", "")), reverse=True)
    result = []
    for room in rooms:
        item = enrich_room(room, db)
        if "_search_distance_km" in room:
            item["distance_km"] = room["_search_distance_km"]
        result.append(item)
    return jsonify({"data": result})


@bp.get("/<room_id>")
def get_room(room_id):
    db = load_db()
    room = next((r for r in db.get("rooms", []) if r.get("id") == room_id and r.get("status", "active") != "hidden"), None)
    if not room:
        return jsonify({"error": "NOT_FOUND", "message": "Không tìm thấy phòng"}), 404
    return jsonify({"data": enrich_room(room, db)})


@bp.post("/<room_id>/verify")
@require_landlord
def verify_room(room_id):
    """MVP: chủ trọ nhập thông tin xác minh và tin được duyệt ngay."""
    user = current_user()
    db = load_db()
    room = next((r for r in db.get("rooms", []) if r.get("id") == room_id), None)
    if not room:
        return jsonify({"error": "NOT_FOUND", "message": "Không tìm thấy tin"}), 404
    if room.get("owner_user_id") != user["id"]:
        return jsonify({"error": "FORBIDDEN", "message": "Bạn không có quyền xác minh tin này"}), 403

    data = request.get_json(silent=True) or {}
    phone = re.sub(r"\s+", "", str(data.get("phone", "")).strip())
    note = str(data.get("note", "")).strip()
    confirmation = str(data.get("confirmation", "")).strip()
    if not re.fullmatch(r"(?:0|\+84)(?:3|5|7|8|9)\d{8}", phone):
        return jsonify({"error": "VALIDATION", "message": "Số điện thoại liên hệ không hợp lệ"}), 400
    if len(note) > 300:
        return jsonify({"error": "VALIDATION", "message": "Nội dung xác nhận tối đa 300 ký tự"}), 400
    if confirmation not in ("confirm", "yes", "true"):
        return jsonify({"error": "VALIDATION", "message": "Vui lòng xác nhận thông tin tin đăng là chính xác"}), 400

    from common import now_iso
    room["verified"] = True
    room["verified_at"] = now_iso()
    room["verification_note"] = note
    room["verification_contact"] = phone
    save_db(db)
    return jsonify({"data": enrich_room(room, db), "message": "Tin đăng đã được xác thực"})


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
