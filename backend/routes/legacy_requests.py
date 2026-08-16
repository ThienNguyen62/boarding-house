from flask import Blueprint, jsonify
from common import current_user, require_landlord, require_tenant
from data_store import load_db

bp = Blueprint("legacy_requests", __name__, url_prefix="/api")

@bp.get("/my/requests")
@require_tenant
def my_requests_legacy():
    user = current_user(); db = load_db()
    items = [x for x in db.get("rental_requests", []) if x.get("tenant_id") == user["id"]]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"data": items})

@bp.get("/landlord/requests")
@require_landlord
def landlord_requests_legacy():
    user = current_user(); db = load_db()
    items = [x for x in db.get("rental_requests", []) if x.get("landlord_user_id") == user["id"]]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"data": items})
