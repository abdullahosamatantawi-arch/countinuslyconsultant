import base64
import os

html_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\n8n_form_wrapper.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('base64,') + 7
if start > 6:
    end = content.find('"', start)
    img_data = base64.b64decode(content[start:end])
    with open(r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\current_embedded_logo.png', 'wb') as f:
        f.write(img_data)
    print("Extracted logo to current_embedded_logo.png")
else:
    print("Base64 not found")
