import csv
import json
import codecs

with open('data.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    lines = list(reader)

# skip header
if len(lines) > 0 and 'المنطقة' in lines[0]:
    lines = lines[1:]

regions = {
    'الشارقه': {'engineers': set(), 'plots': []},
    'المنطقه الوسطى': {'engineers': set(), 'plots': []},
    'المنطقه الشرقيه': {'engineers': set(), 'plots': []}
}

east_keywords = ['خورفكان', 'كلباء', 'الغيل', 'الحراي', 'الساف', 'البراحة', 'وادي الحلو', 'الطريف', 'الزبارة', 'الشرقية']
central_keywords = ['المدام', 'الذيد', 'البطائح', 'الخروس', 'السويح', 'الثمامة', 'الرفيعة', 'محافز', 'نزوى', 'الفاية', 'جبل عمر', 'الند', 'الوسطى']

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

for r_name in regions:
    regions[r_name]['engineers'] = sorted(list(regions[r_name]['engineers']))

with codecs.open('output.js', 'w', encoding='utf-8') as out:
    out.write("const formData = {\n")
    for r_name in regions:
        engs = str(regions[r_name]['engineers']).replace('"', "'")
        plots = str(regions[r_name]['plots']).replace('"', "'")
        out.write(f"    '{r_name}': {{\n")
        out.write(f"        engineers: {engs},\n")
        out.write(f"        plots: {plots}\n")
        out.write("    },\n")
    out.write("};\n")
