import cv2
import torch
import numpy as np
import matplotlib.pyplot as plt

from model import UNet


# -----------------------------
# Load trained model
# -----------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = UNet().to(device)
model.load_state_dict(torch.load("model.pth", map_location=device))
model.eval()


# -----------------------------
# Load test patch
# -----------------------------
before = cv2.imread("patch_dataset/before/bercy_0.png")
after = cv2.imread("patch_dataset/after/bercy_0.png")

before_display = before.copy()
after_display = after.copy()

before_norm = before / 255.0
after_norm = after / 255.0


# -----------------------------
# Prepare input
# -----------------------------
x = np.concatenate((before_norm, after_norm), axis=2)

x = torch.tensor(x).permute(2,0,1).unsqueeze(0).float()
x = x.to(device)


# -----------------------------
# Run model prediction
# -----------------------------
with torch.no_grad():
    pred = model(x)

pred = pred.squeeze().cpu().numpy()

mask = (pred > 0.2).astype(np.uint8)
kernel = np.ones((3,3), np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
print("Prediction range:", pred.min(), pred.max())


# -----------------------------
# Load ground truth mask
# -----------------------------
true_mask = cv2.imread(
    "patch_dataset/mask/bercy_0.png",0
)

true_mask = cv2.resize(true_mask,(mask.shape[1],mask.shape[0]))
true_mask = (true_mask/255).astype(np.uint8)


# -----------------------------
# Calculate Accuracy
# -----------------------------
pred_flat = mask.flatten()
true_flat = true_mask.flatten()

correct = (pred_flat == true_flat).sum()
total = len(pred_flat)

accuracy = correct / total


# -----------------------------
# Calculate IoU
# -----------------------------
intersection = np.logical_and(mask,true_mask)
union = np.logical_or(mask,true_mask)

iou = np.sum(intersection) / np.sum(union)


# -----------------------------
# Calculate Change %
# -----------------------------
changed_pixels = np.sum(mask)
total_pixels = mask.size

change_percentage = (changed_pixels / total_pixels) * 100


# -----------------------------
# Print Results
# -----------------------------
print("\nEvaluation Results")
print("------------------")
print("Change Percentage:", round(change_percentage,2),"%")
print("Model Accuracy:", round(accuracy*100,2),"%")
print("IoU Score:", round(iou,3))


# -----------------------------
# Improve brightness for viewing
# -----------------------------
before_show = before_display * 12
after_show = after_display * 12

before_show = np.clip(before_show,0,255).astype(np.uint8)
after_show = np.clip(after_show,0,255).astype(np.uint8)


# -----------------------------
# Overlay detected change
# -----------------------------
overlay = after_show.copy()

overlay[mask == 1] = [255,0,0]


# -----------------------------
# Show results
# -----------------------------
plt.figure(figsize=(16,4))

plt.subplot(1,4,1)
plt.title("Before")
plt.imshow(cv2.cvtColor(before_show, cv2.COLOR_BGR2RGB))
plt.axis("off")

plt.subplot(1,4,2)
plt.title("After")
plt.imshow(cv2.cvtColor(after_show, cv2.COLOR_BGR2RGB))
plt.axis("off")

plt.subplot(1,4,3)
plt.title("Predicted Mask")
plt.imshow(pred, cmap="hot")
plt.axis("off")

plt.subplot(1,4,4)
plt.title("Change Overlay")
plt.imshow(cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB))
plt.axis("off")

plt.show()