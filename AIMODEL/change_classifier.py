import numpy as np

def classify_change(before, after, mask):

    changed = mask == 1

    before_pixels = before[changed]
    after_pixels = after[changed]

    if len(before_pixels) == 0:
        return {
            "Urbanization":0,
            "Deforestation":0,
            "Water/Flood":0
        }

    urban_pixels = 0
    forest_pixels = 0
    water_pixels = 0

    for b,a in zip(before_pixels, after_pixels):

        r,g,b1 = b
        r2,g2,b2 = a

        # water detection
        if b2 > g2 and b2 > r2:
            water_pixels += 1

        # vegetation loss
        elif g > g2:
            forest_pixels += 1

        # urban surfaces
        else:
            urban_pixels += 1

    total = urban_pixels + forest_pixels + water_pixels

    return {
        "Urbanization": round((urban_pixels/total)*100,2),
        "Deforestation": round((forest_pixels/total)*100,2),
        "Water/Flood": round((water_pixels/total)*100,2)
    }