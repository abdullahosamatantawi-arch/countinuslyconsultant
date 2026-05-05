-- 1. إنشاء جدول الأراضي (plots)
CREATE TABLE IF NOT EXISTS plots (
  id text PRIMARY KEY,
  district_id text NOT NULL,
  suburb_id text NOT NULL, -- أضفناه لتسهيل التصفية
  name text NOT NULL,
  plot_number text NOT NULL,
  section text NOT NULL,
  aerial_image_url text,
  area_sqm integer NOT NULL,
  worshippers_capacity integer NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_available boolean DEFAULT true,
  description text,
  notes text,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. إعداد الصلاحيات (RLS)
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;

-- السماح للجميع برؤية الأراضي
DROP POLICY IF EXISTS "Allow public select on plots" ON plots;
CREATE POLICY "Allow public select on plots" ON plots FOR SELECT USING (true);

-- السماح بتحديث حالة الأرض (للحجز)
DROP POLICY IF EXISTS "Allow public update for reservation" ON plots;
CREATE POLICY "Allow public update for reservation" ON plots FOR UPDATE USING (true);

-- 3. إدخال البيانات الأولية (Seeding)
-- ملاحظة: ON CONFLICT تضمن عدم تكرار البيانات إذا تم تشغيل السكربت مرتين
INSERT INTO plots (id, district_id, suburb_id, name, plot_number, section, aerial_image_url, area_sqm, worshippers_capacity, latitude, longitude, is_available, description)
VALUES 
(
  'qt2-408', 'qatinah', 'muhadhdhab', 'القطينة 2 — قطعة رقم 408', '408', 'القطينة 2', '/aerial/plot-408.png', 7095, 500, 25.401143036040327, 55.67836912603216, true, 
  'أرض شاغرة في القطينة 2 مخصصة لبناء مسجد. تقع في موقع استراتيجي يخدم سكان المنطقة المحيطة.'
),
(
  'qt6-202', 'qatinah', 'muhadhdhab', 'القطينة 6 — قطعة رقم 202', '202', 'القطينة 6', '/aerial/plot-202.png', 5163, 500, 25.396682963282135, 55.70627040993723, true, 
  'أرض شاغرة (المنطقة الخالية 1) في القطينة 6. موقع مميز يخدم عدداً كبيراً من السكان المجاورين.'
),
(
  'qt6-347', 'qatinah', 'muhadhdhab', 'القطينة 6 — قطعة رقم 347', '347', 'القطينة 6', '/aerial/plot-347.png', 2976, 500, 25.392314233044065, 55.70344129257508, true, 
  'أرض شاغرة (المنطقة الخالية 2) في القطينة 6. قطعة واسعة مناسبة لإنشاء مسجد .'
),
(
  'qt1-126', 'qatinah', 'muhadhdhab', 'القطينة 1 — قطعة رقم 126', '126', 'القطينة 1', '/aerial/plot-126.png', 7730, 500, 25.409304571608235, 55.690817622354125, true, 
  'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 1.'
),
(
  'qt6-76', 'qatinah', 'muhadhdhab', 'القطينة 6 — قطعة رقم 76', '76', 'القطينة 6', '/aerial/plot-76.png', 7730, 500, 25.3963865788818, 55.6997120649043, true, 
  'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 6.'
),
(
  'qt2-125', 'qatinah', 'muhadhdhab', 'القطينة 2 — قطعة رقم 125', '125', 'القطينة 2', '/aerial/plot-125.png', 4263, 500, 25.403366691345337, 55.68711722135374, true, 
  'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 2.'
),
(
  'qt3-241', 'qatinah', 'muhadhdhab', 'القطينة 3 — قطعة رقم 241', '241', 'القطينة 3', '/aerial/plot-241.png', 3421, 500, 25.402370058402774, 55.696397507355876, true, 
  'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 3.'
),
(
  'qt4-423', 'qatinah', 'muhadhdhab', 'القطينة 4 — قطعة رقم 423', '423', 'القطينة 4', '/aerial/plot-423.png', 2949, 500, 25.398936142157627, 55.687751205732184, true, 
  'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 4.'
),
(
  'qt4-307', 'qatinah', 'muhadhdhab', 'القطينة 4 — قطعة رقم 307', '307', 'القطينة 4', '/aerial/plot-307.png', 2700, 500, 25.396423269917086, 55.692230031647675, true, 
  'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 4.'
),
(
  'qt5-547', 'qatinah', 'muhadhdhab', 'القطينة 5 — قطعة رقم 547', '547', 'القطينة 5', '/aerial/plot-547.png', 2675, 500, 25.40240984014691, 55.70276087146766, true, 
  'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 5.'
),
(
  'qt5-411', 'qatinah', 'muhadhdhab', 'القطينة 5 — قطعة رقم 411', '411', 'القطينة 5', '/aerial/plot-411.png', 2975, 500, 25.400647529387488, 55.70780801873864, true, 
  'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 5.'
)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  district_id = EXCLUDED.district_id,
  suburb_id = EXCLUDED.suburb_id,
  plot_number = EXCLUDED.plot_number,
  section = EXCLUDED.section,
  area_sqm = EXCLUDED.area_sqm,
  worshippers_capacity = EXCLUDED.worshippers_capacity,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description,
  is_available = plots.is_available; -- نحافظ على حالة الحجز إذا كانت موجودة
