import base64
import re

html_src = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\n8n_form_wrapper.html'
html_dst = r'C:\Users\Abood\.gemini\antigravity\scratch\modern_form_demo\index.html'

with open(html_src, 'r', encoding='utf-8') as f:
    content = f.read()
    match = re.search(r'src="data:image/png;base64,([^"]+)"', content)
    if match:
        b64 = match.group(1)
        with open(html_dst, 'r', encoding='utf-8') as f2:
            content2 = f2.read()
            new_html = re.sub(r'src="data:image/png;base64,[^"]+"', f'src="data:image/png;base64,{b64}"', content2)
            with open(html_dst, 'w', encoding='utf-8') as f2w:
                f2w.write(new_html)
        print("Updated index.html with new logo.")
    else:
        print("Base64 not found in source.")
