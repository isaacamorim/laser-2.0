# backend/app.py

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS

from modules.api.routes import api_bp
from laser.routes import laser_bp

# ---------------------------------------------------------------------------
# Diretórios de assets estáticos
# ---------------------------------------------------------------------------
BASE_PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
FRONTEND_DIR = os.path.join(BASE_PROJECT_DIR, "front")
IMGS_DIR = os.path.join(BASE_PROJECT_DIR, "imgs")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(api_bp)
app.register_blueprint(laser_bp)


# ---------------------------------------------------------------------------
# Rotas estáticas
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(FRONTEND_DIR, filename)


@app.route("/imgs/<path:filename>")
def serve_images(filename):
    return send_from_directory(IMGS_DIR, filename)


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
