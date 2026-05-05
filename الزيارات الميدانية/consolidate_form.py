import base64
import os

# Paths
logo_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\logo.png'
html_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\index.html'
css_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\styles.css'
js_path = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\script.js'

with open(logo_path, 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')

with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

# 1. Embed CSS
html_content = html_content.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css_content}\n</style>')

# 2. Embed JS
html_content = html_content.replace('<script src="script.js"></script>', f'<script>\n{js_content}\n</script>')

# 3. Embed Logo
html_content = html_content.replace('src="logo.png"', f'src="data:image/png;base64,{logo_b64}"')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Form consolidated into standalone index.html successfully.")
