import os
import cv2
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import random
from torch.utils.data import Dataset, DataLoader


# -----------------------------
# Dataset Loader with Balanced Sampling
# -----------------------------

class ChangeDataset(Dataset):

    def __init__(self, before_dir, after_dir, mask_dir, balanced=True):

        self.before_dir = before_dir
        self.after_dir = after_dir
        self.mask_dir = mask_dir

        if balanced:
            # Group patches by city for balanced sampling
            patches_by_city = {}
            for filename in os.listdir(before_dir):
                if filename.endswith('.png'):
                    city = filename.split('_')[0]
                    if city not in patches_by_city:
                        patches_by_city[city] = []
                    patches_by_city[city].append(filename)

            # Create balanced dataset by sampling equally from each city
            self.images = []
            samples_per_city = 13  # Use 13 samples per city (bercy has 14)
            for city, patches in patches_by_city.items():
                if len(patches) >= samples_per_city:
                    # Sample equally from each city
                    selected = random.sample(patches, samples_per_city)
                    self.images.extend(selected)

            print(f"Balanced dataset: {len(self.images)} patches from {len([c for c, p in patches_by_city.items() if len(p) >= samples_per_city])} cities")
        else:
            self.images = sorted(os.listdir(before_dir))

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):

        img_name = self.images[idx]

        before = cv2.imread(os.path.join(self.before_dir, img_name))
        after = cv2.imread(os.path.join(self.after_dir, img_name))
        mask = cv2.imread(os.path.join(self.mask_dir, img_name), 0)

        before = before / 255.0
        after = after / 255.0
        mask = mask / 255.0

        x = np.concatenate((before, after), axis=2)

        x = torch.tensor(x).permute(2,0,1).float()
        y = torch.tensor(mask).unsqueeze(0).float()

        return x, y


# -----------------------------
# U-NET MODEL
# -----------------------------

class DoubleConv(nn.Module):

    def __init__(self, in_channels, out_channels):
        super().__init__()

        self.conv = nn.Sequential(

            nn.Conv2d(in_channels, out_channels, 3, padding=1),
            nn.ReLU(inplace=True),

            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.ReLU(inplace=True)

        )

    def forward(self, x):
        return self.conv(x)


class UNet(nn.Module):

    def __init__(self):
        super().__init__()

        self.down1 = DoubleConv(6,64)
        self.pool1 = nn.MaxPool2d(2)

        self.down2 = DoubleConv(64,128)
        self.pool2 = nn.MaxPool2d(2)

        self.bottleneck = DoubleConv(128,256)

        self.up1 = nn.ConvTranspose2d(256,128,2,stride=2)
        self.conv1 = DoubleConv(256,128)

        self.up2 = nn.ConvTranspose2d(128,64,2,stride=2)
        self.conv2 = DoubleConv(128,64)

        self.final = nn.Conv2d(64,1,1)


    def forward(self,x):

        d1 = self.down1(x)
        p1 = self.pool1(d1)

        d2 = self.down2(p1)
        p2 = self.pool2(d2)

        b = self.bottleneck(p2)

        u1 = self.up1(b)
        c1 = torch.cat([u1,d2],dim=1)
        c1 = self.conv1(c1)

        u2 = self.up2(c1)
        c2 = torch.cat([u2,d1],dim=1)
        c2 = self.conv2(c2)

        return torch.sigmoid(self.final(c2))


# -----------------------------
# Training
# -----------------------------

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

dataset = ChangeDataset(
    "patch_dataset/before",
    "patch_dataset/after",
    "patch_dataset/mask",
    balanced=True  # Use balanced sampling
)

loader = DataLoader(dataset,batch_size=8,shuffle=True)

model = UNet().to(device)

criterion = nn.BCELoss()
optimizer = optim.Adam(model.parameters(),lr=0.001)


EPOCHS = 20  # More epochs for better training


for epoch in range(EPOCHS):

    total_loss = 0

    for x,y in loader:

        x = x.to(device)
        y = y.to(device)

        pred = model(x)

        loss = criterion(pred,y)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1}/{EPOCHS} Loss: {total_loss:.4f}")


torch.save(model.state_dict(),"balanced_model.pth")

print("Balanced model saved as balanced_model.pth")
