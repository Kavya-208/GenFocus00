import numpy as np
from PIL import Image
import base64
import io
import torch

def generate_mask_image(mask: torch.Tensor) -> str:
    mask_np = mask.cpu().numpy().astype(np.uint8) * 255

    h, w = mask_np.shape
    rgb = np.zeros((h, w, 3), dtype=np.uint8)
    rgb[mask_np == 255] = [255, 0, 0]  # red = change
    rgb[mask_np == 0] = [0, 0, 0]      # black = no change

    img = Image.fromarray(rgb)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()

def calculate_area(changed_pixels: int, pixel_size_m: float = 10.0) -> float:
    # Sentinel-2 = 10m x 10m per pixel
    return changed_pixels * (pixel_size_m ** 2)
