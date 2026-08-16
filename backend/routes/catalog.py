from flask import Blueprint, jsonify
from data_store import load_db, load_filter_options

bp = Blueprint("catalog", __name__, url_prefix="/api")


@bp.get("/landlords")
def get_landlords():
    return jsonify({"data": load_db().get("landlords", [])})


@bp.get("/filter-options")
def filter_options():
    return jsonify({"data": load_filter_options()})
