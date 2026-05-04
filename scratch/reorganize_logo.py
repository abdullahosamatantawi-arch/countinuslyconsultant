import cv2
import numpy as np
import base64

# Load original logo
img = cv2.imread(r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\logo.png', cv2.IMREAD_UNCHANGED)
if img is None:
    print("Failed to load logo.png")
    exit()

# Convert to RGBA
if img.shape[2] == 3:
    img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

# Identify white (background) and black (text)
# Based on analyze_colors.py:
# White is [255, 255, 255, 255]
# Black is [0, 0, 0, 255]

white_mask = np.all(img[:, :, :3] > 200, axis=-1)
black_mask = np.all(img[:, :, :3] < 50, axis=-1)

# Reorganize:
# Make the white background BLACK (as requested)
# Make the black text WHITE (to be visible)
# Black color: (0, 0, 0)

new_img = img.copy()
new_img[white_mask, 0:3] = 0 # Black background
new_img[black_mask, 0:3] = 255 # White text

# Save
reorganized_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\logo_reorganized.png'
cv2.imwrite(reorganized_path, new_img)

# Update n8n_form_wrapper.html with this new logo
with open(reorganized_path, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

html_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\n8n_form_wrapper.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

import re
new_html = re.sub(r'src="data:image/png;base64,[^"]+"', f'src="data:image/png;base64,{b64}"', html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Logo reorganized and embedded.")
