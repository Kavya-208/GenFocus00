import cv2
import numpy as np

# Check bercy
mask = cv2.imread('/Users/namitanaik/Documents/DEMO/AIMODEL/archive/train_labels/oscd/bercy/cm/cm.png', 0)
if mask is not None:
    changed = np.sum(mask > 0)
    total = mask.size
    pct = (changed / total) * 100
    print(f'Bercy: {changed}/{total} pixels changed ({pct:.2f}%)')
else:
    print('Bercy mask not found')

# Check abudhabi
mask2 = cv2.imread('/Users/namitanaik/Documents/DEMO/AIMODEL/archive/train_labels/oscd/abudhabi/cm/cm.png', 0)
if mask2 is not None:
    changed2 = np.sum(mask2 > 0)
    total2 = mask2.size
    pct2 = (changed2 / total2) * 100
    print(f'Abudhabi: {changed2}/{total2} pixels changed ({pct2:.2f}%)')
else:
    print('Abudhabi mask not found')