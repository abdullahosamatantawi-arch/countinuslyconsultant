import cv2
import numpy as np
import base64
import os

# Paths
logo_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\logo.png'
html_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\index.html'

if not os.path.exists(logo_path):
    print("Logo not found")
    exit()

# Load image
img = cv2.imread(logo_path, cv2.IMREAD_UNCHANGED)

# Convert to RGBA if not already
if img.shape[2] == 3:
    img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

# 1. Remove white background
# Define white threshold (e.g., all channels > 240)
white_mask = np.all(img[:, :, :3] > 240, axis=-1)
img[white_mask, 3] = 0

# 2. Invert dark text/parts to be visible on dark background
# We want to keep the colors (green/red) but make black/dark gray white.
# Let's target dark pixels (e.g., all channels < 100)
dark_mask = np.all(img[:, :, :3] < 100, axis=-1)
# Make them white (255, 255, 255) but keep alpha
img[dark_mask, 0:3] = 255

# Save the processed image
processed_logo_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\logo_processed.png'
cv2.imwrite(processed_logo_path, img)

# 3. Update index.html with new Base64
with open(processed_logo_path, 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')

with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Find the old base64 and replace it. 
# Since it's a huge string, we'll use a regex-like approach or just target the src="data:..."
import re
new_html = re.sub(r'src="data:image/png;base64,[^"]+"', f'src="data:image/png;base64,{logo_b64}"', html_content)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Logo processed and embedded successfully.")
