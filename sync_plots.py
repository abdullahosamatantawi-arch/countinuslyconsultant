import urllib.request
import csv
import io
import re
import os
import json

SHEET_URL = 'https://docs.google.com/spreadsheets/d/1dhyw_gFmT0_0d_wzNnCBFDgchUvnlJoSd3U2Ni42CWg/export?format=csv&gid=0'
HTML_PATH = 'index.html'

def sync():
    print(f"Fetching data from {SHEET_URL}...")
    try:
        response = urllib.request.urlopen(SHEET_URL)
        content = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching data: {e}")
        return

    reader = csv.reader(io.StringIO(content))
    lines = list(reader)
    
    # skip header if present
    if len(lines) > 0 and 'المنطقة' in lines[0]:
        lines = lines[1:]
    elif len(lines) > 0 and any('Engineer' in col for col in lines[0]):
        lines = lines[1:]
        
    regions = {
        'الشارقه': {'engineers': set(), 'plots': []},
        'المنطقه الوسطى': {'engineers': set(), 'plots': []},
        'المنطقه الشرقيه': {'engineers': set(), 'plots': []}
    }

    east_keywords = ['خورفكان', 'كلباء', 'الغيل', 'الحراي', 'الساف', 'البراحة', 'وادي الحلو', 'الطريف', 'الزبارة', 'الشرقية']
    central_keywords = ['المدام', 'الذيد', 'البطائح', 'الخروس', 'السويح', 'الثمامة', 'الرفيعة', 'محافز', 'نزوى', 'الفاية', 'جبل عمر', 'الند', 'الوسطى']

    count = 0
    for row in lines:
        if len(row) < 13:
            continue
        
        eng = row[0].strip()
        sub_region = row[11].strip()
        plot = row[12].strip()
        
        if not plot:
            continue
            
        target_region = 'الشارقه'
        if any(k in sub_region for k in east_keywords):
            target_region = 'المنطقه الشرقيه'
        elif any(k in sub_region for k in central_keywords):
            target_region = 'المنطقه الوسطى'
            
        if eng:
            regions[target_region]['engineers'].add(eng)
        
        if plot not in regions[target_region]['plots']:
            regions[target_region]['plots'].append(plot)
            count += 1

    for r_name in regions:
        regions[r_name]['engineers'] = sorted(list(regions[r_name]['engineers']))

    # Generate the JS object string
    js_data = "const formData = {\n"
    for r_name in regions:
        # Use json.dumps to ensure proper string escaping, then convert to single quotes for consistency with existing code
        engs = json.dumps(regions[r_name]['engineers'], ensure_ascii=False).replace('"', "'")
        plots = json.dumps(regions[r_name]['plots'], ensure_ascii=False).replace('"', "'")
        js_data += f"            '{r_name}': {{\n"
        js_data += f"                engineers: {engs},\n"
        js_data += f"                plots: {plots}\n"
        js_data += "            },\n"
    js_data += "        };"

    # Update index.html
    if os.path.exists(HTML_PATH):
        with open(HTML_PATH, 'r', encoding='utf-8') as f:
            html = f.read()

        # Regex to find the formData object
        pattern = r'const formData = \{.*?\};'
        if re.search(pattern, html, flags=re.DOTALL):
            new_html = re.sub(pattern, js_data, html, flags=re.DOTALL)
            with open(HTML_PATH, 'w', encoding='utf-8') as f:
                f.write(new_html)
            print(f"Successfully updated {HTML_PATH} with {count} plots.")
        else:
            print(f"Could not find formData pattern in {HTML_PATH}.")
    else:
        print(f"{HTML_PATH} not found.")

    # Also update output.js as a backup
    with open('output.js', 'w', encoding='utf-8') as out:
        out.write(js_data + "\n")
    print("Successfully updated output.js.")

if __name__ == "__main__":
    sync()
