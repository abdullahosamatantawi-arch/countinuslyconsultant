import csv
import json
import codecs

file_path = r'C:\Users\Abood\.gemini\antigravity\brain\39c156a8-0e92-49e3-a239-646d1d1773d9\.system_generated\steps\38\content.md'

with codecs.open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

csv_start = 0
for i, line in enumerate(lines):
    if '---' in line:
        csv_start = i + 1
        break

csv_content = lines[csv_start:]
reader = csv.reader(csv_content)

header = next(reader)

regions = {
    'الشارقه': {'engineers': set(), 'plots': []},
    'المنطقه الوسطى': {'engineers': set(), 'plots': []},
    'المنطقه الشرقيه': {'engineers': set(), 'plots': []}
}

east_keywords = ['خورفكان', 'كلباء', 'الغيل', 'الحراي', 'الساف', 'البراحة', 'وادي الحلو', 'الطريف', 'الزبارة', 'الشرقية']
central_keywords = ['المدام', 'الذيد', 'البطائح', 'الخروس', 'السويح', 'الثمامة', 'الرفيعة', 'محافز', 'نزوى', 'الفاية', 'جبل عمر', 'الند', 'الوسطى']

for row in reader:
    if len(row) < 14:
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
        
    # keep existing engineers + new ones?
    # Actually, just use whatever is in the spreadsheet
    if eng:
        regions[target_region]['engineers'].add(eng)
    
    if plot not in regions[target_region]['plots']:
        regions[target_region]['plots'].append(plot)

for r_name in regions:
    regions[r_name]['engineers'] = sorted(list(regions[r_name]['engineers']))

# Combine with existing engineers just in case?
# The user said "تحديث ارقام القطع الموجودة في الموقع"
# So maybe they just want the plots updated.
# I'll output the JS code directly to a file
with codecs.open('output.js', 'w', encoding='utf-8') as out:
    out.write(json.dumps(regions, ensure_ascii=False, indent=4))
