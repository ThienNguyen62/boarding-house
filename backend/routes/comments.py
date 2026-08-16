from flask import Blueprint, jsonify, request
from common import active_room, current_user, next_id, now_iso, require_login
from data_store import load_db, save_db

bp = Blueprint("comments", __name__, url_prefix="/api/rooms")


def public_comment(comment):
    return {k: comment.get(k, "") for k in ["id", "room_id", "user_id", "user_name", "user_role", "user_avatar", "content", "created_at"]}


@bp.get("/<room_id>/comments")
def list_comments(room_id):
    db = load_db()
    room = active_room(db, room_id)
    if not room:
        return jsonify({"error": "NOT_FOUND", "message": "Không tìm thấy phòng"}), 404
    items = [public_comment(c) for c in db.get("comments", []) if c.get("room_id") == room_id]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"data": items, "count": len(items)})


@bp.post("/<room_id>/comments")
@require_login
def create_comment(room_id):
    user = current_user(); data = request.get_json(silent=True) or {}; content = str(data.get("content", "")).strip()
    if len(content) < 2: return jsonify({"error": "VALIDATION", "message": "Bình luận cần ít nhất 2 ký tự"}), 400
    if len(content) > 800: return jsonify({"error": "VALIDATION", "message": "Bình luận tối đa 800 ký tự"}), 400
    db = load_db(); room = active_room(db, room_id)
    if not room: return jsonify({"error": "NOT_FOUND", "message": "Không tìm thấy phòng"}), 404
    if room.get("owner_user_id") == user.get("id"):
        return jsonify({"error": "OWNER_COMMENT", "message": "Chủ trọ không cần bình luận bài đăng của chính mình"}), 400
    item = {
        "id": next_id("CMT", db.get("comments", [])), "room_id": room_id, "user_id": user["id"],
        "user_name": user.get("name", "Người dùng"), "user_role": user.get("role", "tenant"),
        "user_avatar": user.get("avatar", ""), "content": content, "created_at": now_iso()
    }
    db.setdefault("comments", []).append(item)

    owner_id = room.get("owner_user_id")
    if owner_id:
        notifications = db.setdefault("notifications", [])
        notifications.append({
            "id": next_id("NTF", notifications), "user_id": owner_id, "type": "room_comment",
            "room_id": room_id, "comment_id": item["id"], "title": "Có bình luận mới",
            "message": f'{user.get("name", "Một người dùng")} vừa bình luận về “{room.get("title", "tin đăng của bạn")}".',
            "read": False, "created_at": item["created_at"]
        })
    save_db(db)
    return jsonify({"data": public_comment(item)}), 201
