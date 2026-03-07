import numpy as np
import torch
import cv2

def preprocess_images(before: np.ndarray, after: np.ndarray) -> torch.Tensor:
    before = cv2.resize(before, (256, 256))
    after = cv2.resize(after, (256, 256))

    before = before.astype(np.float32) / 255.0
    after = after.astype(np.float32) / 255.0

    combined = np.concatenate((before, after), axis=2)  # (256, 256, 6)
    tensor = torch.tensor(combined).permute(2, 0, 1).unsqueeze(0).float()

    return tensor
