"""Application entry point. Keep this file intentionally small."""
from app_factory import create_app

app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3000, debug=True)
