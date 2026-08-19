from datetime import datetime
from flask import Blueprint, jsonify, request, session

from common import current_user, hash_pw, public_user
from data_store import load_db, save_db

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    db = load_db()
    user = next((u for u in db.get("users", []) if u.get("email", "").lower() == email), None)
    if not user or user.get("password_hash") != hash_pw(password):
        return jsonify({"error": "INVALID_CREDENTIALS", "message": "Email hoặc mật khẩu không đúng"}), 401
    session.clear()
    session["user_id"] = user["id"]
    return jsonify({"data": public_user(user)})


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    role = str(data.get("role", "tenant")).lower()
    if not name or not email or len(password) < 4:
        return jsonify({"error": "VALIDATION", "message": "Vui lòng nhập đầy đủ thông tin"}), 400
    if role not in ("tenant", "landlord"):
        role = "tenant"
    db = load_db()
    if any(u.get("email", "").lower() == email for u in db.get("users", [])):
        return jsonify({"error": "EMAIL_EXISTS", "message": "Email đã tồn tại"}), 409
    uid = f"U{len(db.get('users', [])) + 1:03d}"
    user = {"id": uid, "email": email, "name": name, "role": role, "avatar": "", "password_hash": hash_pw(password), "verified": False}
    if role == "landlord":
        profile_ids = {str(x.get("id", "")) for x in db.get("landlords", [])}
        n = 1
        while f"LNEW{n:03d}" in profile_ids:
            n += 1
        landlord_id = f"LNEW{n:03d}"
        user["landlord_profile_id"] = landlord_id
        db.setdefault("landlords", []).append({
            "id": landlord_id, "user_id": uid, "name": name,
            "avatar": "https://i.pravatar.cc/150?img=68", "verified": False,
            "rating": 0, "reviews": 0, "rooms": 0, "response_rate": 0,
            "response_time": "Chưa có dữ liệu", "joined": datetime.now().strftime("%Y-%m"), "phone": ""
        })
    db.setdefault("comments", [])
    db.setdefault("notifications", [])
    db.setdefault("saved_rooms", [])
    db.setdefault("rental_requests", [])
    db["users"].append(user)
    save_db(db)
    session.clear()
    session["user_id"] = uid
    return jsonify({"data": public_user(user)}), 201


@bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"data": True})


@bp.get("/me")
def me():
    user = current_user()
    return jsonify({"data": public_user(user) if user else None})
