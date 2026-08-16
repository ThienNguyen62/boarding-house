from pathlib import Path
from flask import Blueprint, redirect, send_from_directory

from common import FRONTEND

bp = Blueprint("pages", __name__)


@bp.get("/")
def home():
    return send_from_directory(FRONTEND, "index.html")


@bp.get("/user")
@bp.get("/user/")
@bp.get("/user/index.html")
def user_home():
    from common import current_user
    if not current_user():
        return redirect("/")
    return send_from_directory(FRONTEND / "user", "index.html")


@bp.get("/pages/<path:path>")
def page_file(path):
    return send_from_directory(FRONTEND / "pages", path)


@bp.get("/assets/<path:path>")
def asset_file(path):
    return send_from_directory(FRONTEND / "assets", path)


@bp.get("/uploads/rooms/<path:path>")
def room_upload(path):
    upload_dir = Path(__file__).resolve().parent.parent / "uploads" / "rooms"
    return send_from_directory(upload_dir, path)


@bp.get("/data/<path:path>")
def legacy_data(path):
    return send_from_directory(FRONTEND / "data", path)
