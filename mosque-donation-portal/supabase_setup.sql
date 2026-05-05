-- 1. جدول استفسارات المتبرعين (donor_inquiries)
CREATE TABLE IF NOT EXISTS donor_inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  plot_id text NOT NULL,
  plot_name text NOT NULL,
  donor_name text NOT NULL,
  donor_phone text NOT NULL,
  donor_email text,
  message text,
  id_card_url text,
  passport_url text
);

-- 2. إعداد الصلاحيات للجدول (Database RLS)
ALTER TABLE donor_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for everyone" ON donor_inquiries;
CREATE POLICY "Enable insert for everyone" ON donor_inquiries FOR INSERT WITH CHECK (true);

-- 3. إعداد الصلاحيات للملفات (Storage RLS)
-- هامة جداً للسماح برفع صور الهوية والجواز
-- ملاحظة: تأكد من إنشاء Bucket باسم documents أولاً
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow public select" ON storage.objects;
CREATE POLICY "Allow public select" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
