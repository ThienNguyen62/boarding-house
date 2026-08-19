from datetime import datetime
import re
from flask import Blueprint, jsonify, request

from common import current_user, require_login
from data_store import load_db, load_verifications, save_verifications

bp = Blueprint("verification", __name__, url_prefix="/api/auth/verification")

PHONE_RE = re.compile(r"^(0|\+84)(3|5|7|8|9)\d{8}$")
CCCD_RE = re.compile(r"^\d{12}$")


def _public(record):
    if not record:
        return {"verified": False, "verified_at": None}
    return {
        "verified": bool(record.get("verified")),
        "verified_at": record.get("verified_at"),
    }


@bp.get("")
@require_login
def get_verification():
    user = current_user()
    record = next((x for x in load_verifications() if x.get("user_id") == user["id"]), None)
    return jsonify({"data": _public(record)})


@bp.post("")
@require_login
def submit_verification():
    user = current_user()
    data = request.get_json(silent=True) or {}
    phone = str(data.get("phone", "")).strip().replace(" ", "")
    citizen_id = str(data.get("citizen_id", "")).strip().replace(" ", "")

    if not PHONE_RE.match(phone):
        return jsonify({"error": "VALIDATION", "message": "Số điện thoại không hợp lệ"}), 400
    if not CCCD_RE.match(citizen_id):
        return jsonify({"error": "VALIDATION", "message": "Căn cước công dân phải có 12 chữ số"}), 400

    records = load_verifications()
    existing = next((x for x in records if x.get("user_id") == user["id"]), None)
    record = {
        "user_id": user["id"],
        "phone": phone,
        "citizen_id": citizen_id,
        "verified": True,
        "verified_at": existing.get("verified_at") if existing and existing.get("verified_at") else datetime.now().isoformat(timespec="seconds"),
        "updated_at": datetime.now().isoformat(timespec="seconds"),
    }
    if existing:
        records[records.index(existing)] = record
    else:
        records.append(record)
    save_verifications(records)

    # Cập nhật đồng bộ trạng thái cho hồ sơ chủ trọ hiện có.
    db = load_db()
    for landlord in db.get("landlords", []):
        if landlord.get("user_id") == user["id"] or (landlord.get("id") == user.get("landlord_profile_id")):
            landlord["verified"] = True

    # Nếu user hiện tại là landlord nhưng dữ liệu cũ thiếu liên kết profile, tự liên kết theo user_id.
    if user.get("role") == "landlord" and not user.get("landlord_profile_id"):
        landlord = next((x for x in db.get("landlords", []) if x.get("user_id") == user["id"]), None)
        if landlord:
            user["landlord_profile_id"] = landlord["id"]
    for item in db.get("users", []):
        if item.get("id") == user["id"]:
            item.update({"landlord_profile_id": user.get("landlord_profile_id", item.get("landlord_profile_id", "")), "verified": True})
            break
    from data_store import save_db
    save_db(db)
    return jsonify({"data": _public(record)})
