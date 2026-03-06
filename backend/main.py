from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import io

from preprocessing import preprocess_images
from inference import load_model, run_inference
from mask_utils import generate_mask_image, calculate_area

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

load_model()

@app.get("/")
def home():
    return {"message": "Earth Change Detection API Running"}

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
