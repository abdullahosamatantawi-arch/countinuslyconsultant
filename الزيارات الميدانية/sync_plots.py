import urllib.request
import csv
import io
import re
import os
import json

SHEET_URL = 'https://docs.google.com/spreadsheets/d/1dhyw_gFmT0_0d_wzNnCBFDgchUvnlJoSd3U2Ni42CWg/export?format=csv&gid=0'
NEW_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1HpbDPdxKoMLHLjkxk4w8aTokA9SQe0eC7eJzoT6gPOU/export?format=csv'

# Get the directory where the script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(SCRIPT_DIR, 'index.html')
OUTPUT_JS_PATH = os.path.join(SCRIPT_DIR, 'output.js')

def fetch_data(url, local_fallback):
    print(f"Fetching data from {url}...")
    content = None
    try:
        response = urllib.request.urlopen(url)
        content = response.read().decode('utf-8')
    except Exception as e:
        print(f"urllib failed: {e}. Trying curl.exe fallback...")
        try:
            import subprocess
            subprocess.run(['curl.exe', '-L', url, '-o', 'temp_data.csv'], check=True)
            if os.path.exists('temp_data.csv'):
                with open('temp_data.csv', 'r', encoding='utf-8') as f:
                    content = f.read()
                os.remove('temp_data.csv')
        except Exception as e2:
            print(f"curl.exe fallback failed: {e2}")
            if local_fallback and os.path.exists(local_fallback):
                print(f"Using {local_fallback} as fallback.")
                with open(local_fallback, 'r', encoding='utf-8') as f:
                    content = f.read()
    return content

def sync():
    content = fetch_data(SHEET_URL, os.path.join(SCRIPT_DIR, 'data_new.csv'))
    if not content:
        print("Error: Could not fetch main sheet data.")
        return

    reader = csv.reader(io.StringIO(content))
    lines = list(reader)
    
    header = []
    if len(lines) > 0 and ('المنطقة' in lines[0] or 'المنطقه' in lines[0] or 'المهندس المسؤول' in lines[0] or 'Engineer' in lines[0]):
        header = [col.strip() for col in lines[0]]
        lines = lines[1:]
        
    eng_idx = 0
    region_idx = 11
    plot_idx = 12
    
    if header:
        if 'المهندس المسؤول' in header:
            eng_idx = header.index('المهندس المسؤول')
        elif 'Responsible Engineer' in header:
            eng_idx = header.index('Responsible Engineer')
            
        for i, col in enumerate(header):
            if 'المنطقة' in col or 'المنطقه' in col:
                region_idx = i
                break
                
        for i, col in enumerate(header):
            if 'رقم القطعة' in col or 'رقم القطعه' in col or 'Plot Number' in col:
                plot_idx = i
                break

    regions = {
        'الشارقه': {'engineers': set(), 'plots': []},
        'المنطقه الوسطى': {'engineers': set(), 'plots': []},
        'المنطقه الشرقيه': {'engineers': set(), 'plots': []},
        'المساجد الخاصة': {'engineers': set(), 'plots': []},
        'المساجد تحت الدراسة': {'engineers': set(), 'plots': {}}
    }

    east_keywords = ['خورفكان', 'كلباء', 'الغيل', 'الحراي', 'الساف', 'البراحة', 'وادي الحلو', 'الطريف', 'الزبارة', 'الشرقية']
    central_keywords = ['المدام', 'الذيد', 'البطائح', 'الخروس', 'السويح', 'الثمامة', 'الرفيعة', 'محافز', 'نزوى', 'الفاية', 'جبل عمر', 'الند', 'الوسطى']

    current_region = 'الشارقه'
    count = 0
    for row in lines:
        if not any(row): continue
        
        # Detect region header row
        first_col = row[0].strip() if len(row) > 0 else ""
        if len([c for c in row if c.strip()]) == 1:
            header_text = first_col.replace('ة', 'ه')
            if 'الشارقه' in header_text:
                current_region = 'الشارقه'
                continue
            elif 'الوسطى' in header_text:
                current_region = 'المنطقه الوسطى'
                continue
            elif 'الشرقيه' in header_text:
                current_region = 'المنطقه الشرقيه'
                continue
            elif 'الخاصة' in header_text or 'الخاصه' in header_text:
                current_region = 'المساجد الخاصة'
                continue

        max_idx = max(eng_idx, region_idx, plot_idx)
        if len(row) <= max_idx:
            continue
        
        eng = row[eng_idx].strip()
        sub_region = row[region_idx].strip()
        plot = row[plot_idx].strip()
        
        if not plot:
            continue
            
        target_region = current_region
        if current_region != 'المساجد الخاصة':
            if any(k in sub_region for k in east_keywords):
                target_region = 'المنطقه الشرقيه'
            elif any(k in sub_region for k in central_keywords):
                target_region = 'المنطقه الوسطى'
            
        if eng:
            # Clean engineer name
            eng = re.sub(r'\s+', ' ', eng).strip()
            regions[target_region]['engineers'].add(eng)
        
        if plot not in regions[target_region]['plots']:
            regions[target_region]['plots'].append(plot)
            count += 1

    # Hardcode 'م/محمد حمدي' into 'المساجد الخاصة' to preserve user's manual addition
    regions['المساجد الخاصة']['engineers'].add('م/محمد حمدي')

    # Fetch and parse new sheet (المساجد تحت الدراسة)
    new_content = fetch_data(NEW_SHEET_URL, os.path.join(SCRIPT_DIR, 'new_sheet.csv'))
    if new_content:
        new_reader = csv.reader(io.StringIO(new_content))
        new_lines = list(new_reader)
        
        new_header = []
        if len(new_lines) > 0 and ('المنطقة' in new_lines[0] or 'المنطقه' in new_lines[0] or 'المهندس المسؤول' in new_lines[0] or 'رقم القطعة' in new_lines[0]):
            new_header = [col.strip() for col in new_lines[0]]
            new_lines = new_lines[1:]
            
        new_eng_idx = 11
        new_plot_idx = 8
        
        if new_header:
            if 'المهندس المسؤول' in new_header:
                new_eng_idx = new_header.index('المهندس المسؤول')
            for i, col in enumerate(new_header):
                if 'رقم القطعة' in col or 'رقم القطعه' in col:
                    new_plot_idx = i
                    break
        
        for row in new_lines:
            if not any(row): continue
            max_idx = max(new_eng_idx, new_plot_idx)
            if len(row) <= max_idx: continue
            
            eng = row[new_eng_idx].strip()
            plot = row[new_plot_idx].strip()
            
            if not eng:
                continue
            
            # Clean engineer name
            eng = re.sub(r'\s+', ' ', eng).strip()
            
            if eng:
                regions['المساجد تحت الدراسة']['engineers'].add(eng)
                if eng not in regions['المساجد تحت الدراسة']['plots']:
                    regions['المساجد تحت الدراسة']['plots'][eng] = []
                if plot and plot not in regions['المساجد تحت الدراسة']['plots'][eng]:
                    regions['المساجد تحت الدراسة']['plots'][eng].append(plot)
                    count += 1
    else:
        print("Warning: Could not fetch mosques under study sheet. Skipping.")

    for r_name in regions:
        regions[r_name]['engineers'] = sorted(list(regions[r_name]['engineers']))

    # Generate the JS object string
    js_data = "const formData = {\n"
    for r_name in regions:
        engs = json.dumps(regions[r_name]['engineers'], ensure_ascii=False).replace('"', "'")
        
        if isinstance(regions[r_name]['plots'], dict):
            plots_dict = regions[r_name]['plots']
            sorted_plots_dict = {k: sorted(v) for k, v in sorted(plots_dict.items())}
            plots = json.dumps(sorted_plots_dict, ensure_ascii=False).replace('"', "'")
        else:
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

        pattern = r'const formData = \{.*?\};'
        if re.search(pattern, html, flags=re.DOTALL):
            new_html = re.sub(pattern, js_data, html, flags=re.DOTALL)
            with open(HTML_PATH, 'w', encoding='utf-8') as f:
                f.write(new_html)
            print(f"Successfully updated HTML file with {count} plots.")
        else:
            print(f"Could not find formData pattern in {HTML_PATH}.")
    else:
        print(f"{HTML_PATH} not found.")

    with open(OUTPUT_JS_PATH, 'w', encoding='utf-8') as out:
        out.write(js_data + "\n")
    print(f"Successfully updated output.js backup.")

if __name__ == "__main__":
    sync()
