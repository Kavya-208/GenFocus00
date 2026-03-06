import torch
import torch.nn as nn
import os

# -----------------------------------------------
# PLACEHOLDER MODEL
# Replace this with teammate's model when ready
# -----------------------------------------------
class PlaceholderModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Conv2d(6, 1, 1)

    def forward(self, x):
        return torch.sigmoid(self.conv(x))

model = None

def load_model():
    global model

    # ✅ When teammate gives model.pth, it will auto-load here
    if os.path.exists("model.pth"):
        # TODO: Replace PlaceholderModel with teammate's model class
        model = PlaceholderModel()
        model.load_state_dict(torch.load("model.pth", map_location="cpu"))
        print("✅ Loaded trained model weights")
    else:
        model = PlaceholderModel()
        print("⚠️  Using placeholder model — swap model.pth when ready")

    model.eval()

def run_inference(tensor: torch.Tensor) -> torch.Tensor:
    global model
    with torch.no_grad():
        prediction = model(tensor)
    return prediction