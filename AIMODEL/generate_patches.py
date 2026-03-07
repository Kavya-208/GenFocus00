import cv2
import os
from dataset_loader import load_image_pair

PATCH_SIZE = 256

os.makedirs("patch_dataset/before", exist_ok=True)
os.makedirs("patch_dataset/after", exist_ok=True)
os.makedirs("patch_dataset/mask", exist_ok=True)


def generate_patches(img_pair, mask, city, patch_counter):

    img1 = img_pair[:, :, :3]
    img2 = img_pair[:, :, 3:]

    h, w, _ = img1.shape

    for y in range(0, h - PATCH_SIZE + 1, PATCH_SIZE):
        for x in range(0, w - PATCH_SIZE + 1, PATCH_SIZE):

            patch1 = img1[y:y+PATCH_SIZE, x:x+PATCH_SIZE]
            patch2 = img2[y:y+PATCH_SIZE, x:x+PATCH_SIZE]
            patch_mask = mask[y:y+PATCH_SIZE, x:x+PATCH_SIZE]

            if patch1.shape[0] == PATCH_SIZE and patch1.shape[1] == PATCH_SIZE:

                cv2.imwrite(f"patch_dataset/before/{city}_{patch_counter}.png", patch1)
                cv2.imwrite(f"patch_dataset/after/{city}_{patch_counter}.png", patch2)
                cv2.imwrite(f"patch_dataset/mask/{city}_{patch_counter}.png", patch_mask)

                patch_counter += 1

    return patch_counter


# -------- MAIN --------

base_path = "archive/images/oscd"

cities = [c for c in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, c))]

patch_counter = 0

for city in cities:

    print("Processing:", city)

    images, mask = load_image_pair(city)

    # skip city if mask not found
    if mask is None:
        print("Skipping city (mask missing):", city)
        continue

    for img_pair in images:
        patch_counter = generate_patches(img_pair, mask, city, patch_counter)

print("\nTotal patches generated:", patch_counter)