# NAHI HERBS AI — Grand Master Edition

A redesigned, responsive plant-health web app with a premium agriculture dashboard, camera capture, image upload, optional AI backend, field report, location coordinates, and light/dark mode.

## Fast preview (no Python / no API key)

1. Extract this ZIP.
2. Open `frontend/index.html` in Chrome or Edge.
3. Upload a plant photo. The app will show a **clearly labelled sample report** when the AI backend is not running.

Camera access may require localhost or HTTPS. For a simple local server, open a terminal in the extracted project folder and run:

```bash
py -m http.server 8080 --directory frontend
```

Then open `http://127.0.0.1:8080`.

## Enable real AI image analysis (optional)

Real AI analysis requires internet access and an API key. API usage may cost money.

1. Install Python 3.10+.
2. Open a terminal in this extracted project folder.
3. Install dependencies:

   ```bash
   py -m pip install -r backend/requirements.txt
   ```

4. Create `backend/.env` and add:

   ```env
   OPENAI_API_KEY=put_your_own_key_here
   OPENAI_MODEL=gpt-4.1-mini
   ```

   Keep `.env` private. Never upload your API key to GitHub or put it in frontend JavaScript.

5. Start the backend:

   ```bash
   py backend/app.py
   ```

6. Open `http://127.0.0.1:5000`. The app will use the backend automatically.

## Included

- `frontend/index.html` — page structure
- `frontend/style.css` — responsive premium UI
- `frontend/script.js` — camera, upload, demo mode, report, location, theme
- `frontend/assets/` — bundled farm imagery from the supplied project
- `backend/app.py` — optional Flask API and AI image analysis
- `backend/requirements.txt` — Python dependencies

## Important notes

- The sample report is **not a diagnosis** and does not analyze the uploaded image.
- AI suggestions can be wrong. Confirm suspected disease and treatment with a qualified local agricultural professional.
- Browser camera and geolocation permissions require user consent. Browsers commonly require HTTPS or localhost for these APIs.
- The location tool returns coordinates only; it does not automatically find verified agricultural services.
