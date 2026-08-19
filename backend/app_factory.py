from flask import Flask

from common import FRONTEND
from routes.auth import bp as auth_bp
from routes.catalog import bp as catalog_bp
from routes.rooms import bp as rooms_bp
from routes.landlord_rooms import bp as landlord_rooms_bp
from routes.saved import bp as saved_bp
from routes.requests import bp as requests_bp
from routes.legacy_requests import bp as legacy_requests_bp
from routes.comments import bp as comments_bp
from routes.notifications import bp as notifications_bp
from routes.uploads import bp as uploads_bp
from routes.verification import bp as verification_bp
from routes.pages import bp as pages_bp


def create_app():
    app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")
    app.secret_key = "trosmart-mvp-local-secret"
    app.config["SESSION_COOKIE_NAME"] = "trosmart_session"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    @app.get("/api/health")
    def health():
        return {"ok": True}

    app.register_blueprint(auth_bp)
    app.register_blueprint(catalog_bp)
    app.register_blueprint(rooms_bp)
    app.register_blueprint(landlord_rooms_bp)
    app.register_blueprint(saved_bp)
    app.register_blueprint(requests_bp)
    app.register_blueprint(legacy_requests_bp)
    app.register_blueprint(comments_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(uploads_bp)
    app.register_blueprint(verification_bp)
    app.register_blueprint(pages_bp)
    return app
