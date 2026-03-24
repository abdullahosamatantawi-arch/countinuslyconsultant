import base64
import os

# Paths
logo_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\logo.png'
html_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\n8n_form_wrapper.html'

if os.path.exists(logo_path) and os.path.exists(html_path):
    with open(logo_path, 'rb') as f:
        img_data = f.read()
        b64_string = base64.b64encode(img_data).decode('utf-8')
    
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Replace the relative src with the base64 data URI
    new_html = html_content.replace('src="logo.png"', f'src="data:image/png;base64,{b64_string}"')
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("Logo embedded successfully.")
else:
    print("Files not found.")
