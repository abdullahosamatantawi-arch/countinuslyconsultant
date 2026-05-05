import cv2
import numpy as np

img = cv2.imread(r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\logo.png', cv2.IMREAD_UNCHANGED)
if img is None:
    print("Failed to load logo.png")
    exit()

# Flatten and find unique colors or most common
pixels = img.reshape(-1, img.shape[-1])
unique, counts = np.unique(pixels, axis=0, return_counts=True)

# Sort by counts
sorted_indices = np.argsort(-counts)
for i in range(min(10, len(sorted_indices))):
    idx = sorted_indices[i]
    print(f"Color {unique[idx]}: {counts[idx]} pixels")
