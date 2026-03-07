



import os
import cv2
import numpy as np




def load_image_pair(city):

    # path to satellite images
    path1 = f"archive/images/oscd/{city}/imgs_1_rect"
    path2 = f"archive/images/oscd/{city}/imgs_2_rect"

    images1 = sorted(os.listdir(path1))

    data = []

    for img_name in images1:

        img1_path = os.path.join(path1, img_name)
        img2_path = os.path.join(path2, img_name)

        img1 = cv2.imread(img1_path)
        img2 = cv2.imread(img2_path)

        if img1 is None or img2 is None:
            continue

        # combine before and after images
        combined = np.concatenate((img1, img2), axis=2)

        data.append(combined)

    # load change mask
    mask_path = f"archive/train_labels/oscd/{city}/cm/cm.png"
    mask = cv2.imread(mask_path)

    return data, mask


