import cv2
import torch
import numpy as np
from model import UNet
from change_classifier import classify_change

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load trained model
model = UNet().to(device)
model.load_state_dict(torch.load("model.pth", map_location=device))
model.eval()


def detect_change(before_path, after_path):

    before = cv2.imread(before_path)
    after = cv2.imread(after_path)

    # normalize brightness
    before = cv2.normalize(before, None, 0, 255, cv2.NORM_MINMAX)
    after = cv2.normalize(after, None, 0, 255, cv2.NORM_MINMAX)

    before_norm = before / 255.0
    after_norm = after / 255.0

    x = np.concatenate((before_norm, after_norm), axis=2)

    x = torch.tensor(x).permute(2,0,1).unsqueeze(0).float().to(device)

    with torch.no_grad():
        pred = model(x)

    pred = pred.squeeze().cpu().numpy()

    mask = (pred > 0.2).astype(np.uint8)

    changed_pixels = np.sum(mask)
    total_pixels = mask.size

    change_percentage = (changed_pixels / total_pixels) * 100

    result = classify_change(before, after, mask)

    return {
        "change_percentage": round(change_percentage,2),
        "change_type": result
    }