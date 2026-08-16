from pathlib import Path
import uuid
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

from common import current_user, require_landlord

bp = Blueprint("uploads", __name__, url_prefix="/api/uploads")
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "rooms"
ALLOWED = {"png", "jpg", "jpeg", "webp"}
MAX_SIZE = 5 * 1024 * 1024


@bp.post("/room-image")
@require_landlord
def room_image():
    file = request.files.get("image")
    if not file or not file.filename:
        return jsonify({"error": "VALIDATION", "message": "Vui lòng chọn ảnh phòng"}), 400
    filename = secure_filename(file.filename)
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext not in ALLOWED:
        return jsonify({"error": "INVALID_IMAGE", "message": "Chỉ hỗ trợ JPG, JPEG, PNG hoặc WEBP"}), 400
    file.stream.seek(0, 2); size = file.stream.tell(); file.stream.seek(0)
    if size > MAX_SIZE:
        return jsonify({"error": "IMAGE_TOO_LARGE", "message": "Ảnh tối đa 5MB"}), 400
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    user = current_user(); name = f"{user['id']}_{uuid.uuid4().hex[:10]}.{ext}"; target = UPLOAD_DIR / name; file.save(target)
    return jsonify({"data": {"url": f"/uploads/rooms/{name}", "filename": name}}), 201
