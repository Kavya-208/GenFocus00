import torch
import torch.nn as nn
import os
import numpy as np
import cv2

# Import the real UNet model from teammate's folder
from prakrithi.prakrithi.model import UNet
from prakrithi.prakrithi.change_classifier import classify_change

model = None

def load_model():
    global model
    
    # Path to the trained model weights in prakrithi folder
    model_path = os.path.join("prakrithi", "prakrithi", "model.pth")
    
    if os.path.exists(model_path):
        model = UNet()
        model.load_state_dict(torch.load(model_path, map_location="cpu"))
        print("✅ Loaded trained UNet model weights from prakrithi/prakrithi/model.pth")
    else:
        model = UNet()  # Fallback to untrained model
        print("⚠️  Model weights not found, using untrained UNet model")
    
    model.eval()

def run_inference(tensor: torch.Tensor, before_img: np.ndarray, after_img: np.ndarray) -> dict:
    """
    Run inference with the real UNet model and return mask + change classification
    """
    global model
    with torch.no_grad():
        prediction = model(tensor)
    
    # Convert to numpy for post-processing (matching predict.py logic)
    pred_np = prediction.squeeze().cpu().numpy()
    
    # Apply threshold and morphological cleaning (from predict.py)
    mask = (pred_np > 0.2).astype(np.uint8)
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    
    # Get change classification
    change_types = classify_change(before_img, after_img, mask)
    
    return {
        "prediction": prediction,  # Keep tensor for compatibility
        "mask": mask,              # Numpy array for mask generation
        "change_types": change_types
    }