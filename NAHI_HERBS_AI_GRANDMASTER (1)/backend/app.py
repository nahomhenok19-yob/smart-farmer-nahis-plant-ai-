import base64
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
load_dotenv(Path(__file__).resolve().parent / ".env")

app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")
CORS(app, resources={r"/analyze": {"origins": "*"}})
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024


@app.get("/")
def home():
    return send_from_directory(FRONTEND, "index.html")


@app.get("/health")
def health():
    return jsonify({"app": "Nahi Herbs AI", "status": "online",
                    "ai_configured": bool(os.getenv("OPENAI_API_KEY"))})


@app.post("/analyze")
def analyze():
    image = request.files.get("image")
    if image is None:
        return jsonify({"success": False, "error": "Upload an image using the image field."}), 400
    if not image.mimetype or not image.mimetype.startswith("image/"):
        return jsonify({"success": False, "error": "The uploaded file must be an image."}), 400
    raw = image.read()
    if not raw:
        return jsonify({"success": False, "error": "The image is empty."}), 400
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return jsonify({"success": False, "error": "AI is not configured. Add OPENAI_API_KEY to backend/.env. The frontend can still run in demo mode."}), 503

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        mime = image.mimetype if image.mimetype in ("image/jpeg", "image/png", "image/webp", "image/gif") else "image/jpeg"
        encoded = base64.b64encode(raw).decode("ascii")
        prompt = """You are a cautious agricultural plant-health assistant. Examine only what is visible in the image. Do not claim certainty. If no plant is visible, say so. Return only valid JSON with keys: plant, health_status, possible_disease, confidence (integer 0-100), symptoms, treatment, prevention, warning. Distinguish visible observations from possible causes. Give general, low-risk care suggestions; do not prescribe pesticide doses or unsafe chemical use. Encourage confirmation by a qualified local agricultural professional before any chemical treatment. If evidence is insufficient, clearly say that."""
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            input=[{"role": "user", "content": [
                {"type": "input_text", "text": prompt},
                {"type": "input_image", "image_url": f"data:{mime};base64,{encoded}"}
            ]}]
        )
        text = response.output_text.strip()
        # Be tolerant if a model wraps the JSON in a markdown fence.
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        import json
        report = json.loads(text)
        report["confidence"] = max(0, min(100, int(report.get("confidence", 0))))
        return jsonify({"success": True, "report": report})
    except ImportError:
        return jsonify({"success": False, "error": "Install backend dependencies using: python -m pip install -r requirements.txt"}), 500
    except Exception as exc:
        app.logger.exception("Plant analysis failed")
        return jsonify({"success": False, "error": "Analysis failed. Check your API key, internet connection, model access, and backend console."}), 502


@app.errorhandler(413)
def too_large(_error):
    return jsonify({"success": False, "error": "Image exceeds the 12 MB upload limit."}), 413


if __name__ == "__main__":
    print("Nahi Herbs AI running at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
