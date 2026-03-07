from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import base64
import io
from pydantic import BaseModel

from preprocessing import preprocess_images
from inference import load_model, run_inference
from mask_utils import generate_mask_image, calculate_area
from satellite import get_satellite_images, download_image_as_bytes

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)
load_model()

# ─────────────────────────────────────────
# HOME
# ─────────────────────────────────────────
@app.get("/")
def home():
    return {"message": "Earth Change Detection API Running"}


# ─────────────────────────────────────────
# MANUAL IMAGE UPLOAD (existing feature)
# ─────────────────────────────────────────
@app.post("/detect-change")
async def detect_change(
    image_before: UploadFile = File(...),
    image_after: UploadFile = File(...)
):
    before = np.array(Image.open(image_before.file).convert("RGB"))
    after = np.array(Image.open(image_after.file).convert("RGB"))

    tensor = preprocess_images(before, after)
    prediction = run_inference(tensor)

    mask = (prediction > 0.5).squeeze()
    changed_pixels = int(mask.sum().item())
    confidence = float(prediction.mean().item())
    affected_area = calculate_area(changed_pixels)
    mask_base64 = generate_mask_image(mask)

    return {
        "change_detected": changed_pixels > 0,
        "changed_pixels": changed_pixels,
        "affected_area_m2": affected_area,
        "confidence": round(confidence, 4),
        "change_mask": f"data:image/png;base64,{mask_base64}"
    }


# ─────────────────────────────────────────
# FETCH NASA SATELLITE IMAGES FOR LOCATION
# ─────────────────────────────────────────
@app.get("/satellite-images")
async def satellite_images(
    lat: float,
    lon: float,
    date1: str,
    date2: str
):
    try:
        result = get_satellite_images(lat, lon, date1, date2)
        return result
    except Exception as e:
        return {"error": str(e)}


# ─────────────────────────────────────────
# LOCATION BASED CHANGE DETECTION
# ─────────────────────────────────────────
@app.post("/detect-change-location")
async def detect_change_location(
    lat: float,
    lon: float,
    date1: str,
    date2: str
):
    try:
        # Step 1: Get satellite images from NASA
        images = get_satellite_images(lat, lon, date1, date2)

        # Step 2: Download both images
        before_bytes = download_image_as_bytes(images["before_url"])
        after_bytes = download_image_as_bytes(images["after_url"])

        # Step 3: Convert to numpy arrays
        before = np.array(Image.open(io.BytesIO(before_bytes)).convert("RGB"))
        after = np.array(Image.open(io.BytesIO(after_bytes)).convert("RGB"))

        # Step 4: Run change detection
        tensor = preprocess_images(before, after)
        prediction = run_inference(tensor)
        mask = (prediction > 0.5).squeeze()
        changed_pixels = int(mask.sum().item())
        confidence = float(prediction.mean().item())
        affected_area = calculate_area(changed_pixels)
        mask_base64 = generate_mask_image(mask)

        return {
            "change_detected": changed_pixels > 0,
            "changed_pixels": changed_pixels,
            "affected_area_m2": affected_area,
            "confidence": round(confidence, 4),
            "change_mask": f"data:image/png;base64,{mask_base64}",
            "before_image": images["before_url"],
            "after_image": images["after_url"],
            "location": {"lat": lat, "lon": lon},
            "dates": {"date1": date1, "date2": date2}
        }
    except Exception as e:
        return {"error": str(e)}


# ─────────────────────────────────────────
# AI AGENT CHAT (n8n webhook)
# ─────────────────────────────────────────
import httpx

N8N_WEBHOOK_URL = "https://nireeksha24aiml.app.n8n.cloud/webhook/earth-agent"  # ← update later

class ChatRequest(BaseModel):
    message: str
    analysis_context: dict = {}

def generate_fallback_response(message: str, analysis_context: dict) -> str:
    """Generate a basic AI response when n8n is unavailable"""
    change_detected = analysis_context.get("change_detected", False)
    change_types = analysis_context.get("change_types", {})
    affected_area = analysis_context.get("affected_area_m2", 0)
    confidence = analysis_context.get("confidence", 0)

    if change_detected:
        # Find the dominant change type
        if change_types:
            dominant_type = max(change_types.items(), key=lambda x: x[1])
            type_name = dominant_type[0]
            type_percent = dominant_type[1]
        else:
            type_name = "unknown"
            type_percent = 0

        response = f"I detected changes in the satellite images! The main type of change appears to be {type_name} ({type_percent:.1f}%), affecting approximately {affected_area:.0f} square meters with {confidence:.1f}% confidence."

        if "flood" in message.lower() or "water" in message.lower():
            response += " This could indicate flooding or water-related changes."
        elif "urban" in message.lower() or "city" in message.lower():
            response += " This suggests urban development or construction activity."
        elif "forest" in message.lower() or "deforest" in message.lower():
            response += " This indicates deforestation or vegetation loss."

    else:
        response = "I analyzed the satellite images and didn't detect any significant changes between the before and after dates."

    return response

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        print("📤 Sending to n8n:", {
            "message": request.message,
            "change_detected": request.analysis_context.get("change_detected", False),
            "change_types": request.analysis_context.get("change_types", {}),
            "affected_area_m2": request.analysis_context.get("affected_area_m2", 0),
            "confidence": request.analysis_context.get("confidence", 0),
        })

        async with httpx.AsyncClient() as client:
            response = await client.post(
                N8N_WEBHOOK_URL,
                json={
                    "message": request.message,
                    "change_detected": request.analysis_context.get("change_detected", False),
                    "change_types": request.analysis_context.get("change_types", {}),
                    "affected_area_m2": request.analysis_context.get("affected_area_m2", 0),
                    "confidence": request.analysis_context.get("confidence", 0),
                },
                timeout=30.0
            )

            print("📥 n8n status:", response.status_code)
            print("📥 n8n response headers:", dict(response.headers))
            print("📥 n8n response text:", repr(response.text))

            # Check for successful response
            if response.status_code != 200:
                print(f"❌ n8n returned status {response.status_code}")
                fallback = generate_fallback_response(request.message, request.analysis_context)
                return {"response": f"[FALLBACK] {fallback}"}

            # Check for empty response
            if not response.text or response.text.strip() == "":
                print("❌ n8n returned empty response body")
                fallback = generate_fallback_response(request.message, request.analysis_context)
                return {"response": f"[FALLBACK] {fallback}"}

            # Try to parse JSON
            try:
                data = response.json()
                print("📥 n8n response JSON:", data)

                # Handle different response formats
                if isinstance(data, dict):
                    # Check for direct response field
                    if "response" in data:
                        return {"response": data["response"]}
                    # Check for content field (OpenAI format)
                    elif "content" in data and isinstance(data["content"], list) and len(data["content"]) > 0:
                        first_content = data["content"][0]
                        if isinstance(first_content, dict) and "text" in first_content:
                            return {"response": first_content["text"]}
                        elif isinstance(first_content, str):
                            return {"response": first_content}

                # If we can't parse the expected format, return the raw response
                print("⚠️  Unexpected response format, returning raw data")
                return {"response": str(data)}

            except Exception as parse_error:
                print(f"❌ Failed to parse JSON: {parse_error}")
                print("📥 Raw response:", response.text)
                fallback = generate_fallback_response(request.message, request.analysis_context)
                return {"response": f"[FALLBACK] {fallback}"}

    except httpx.TimeoutException:
        print("⏰ n8n request timed out")
        fallback = generate_fallback_response(request.message, request.analysis_context)
        return {"response": f"[FALLBACK] {fallback}"}

    except Exception as e:
        print("💥 Chat error:", str(e))
        fallback = generate_fallback_response(request.message, request.analysis_context)
        return {"response": f"[FALLBACK] {fallback}"}

