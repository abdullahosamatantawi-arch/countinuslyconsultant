-- Database Schema for Accreditation Follow-up System (Mosque Approval System)

-- 1. Create custom ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'engineer', 'consultant');
CREATE TYPE project_status AS ENUM ('draft', 'pending_approval', 'under_construction', 'completed', 'cancelled');
CREATE TYPE stage_type AS ENUM ('architectural', 'structural', 'mep', 'civil_defense', 'planning');
CREATE TYPE stage_status AS ENUM ('pending_submission', 'submitted', 'under_review', 'approved', 'rejected', 'requires_modification');
CREATE TYPE submission_status AS ENUM ('under_review', 'approved', 'rejected');

-- 2. Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'consultant',
    company_name TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: In a real app, you would create a trigger to auto-create a profile on user signup
-- CREATE OR REPLACE FUNCTION public.handle_new_user() ...

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    plot_number TEXT NOT NULL,
    region TEXT NOT NULL,
    land_area NUMERIC,
    consultant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_engineer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status project_status DEFAULT 'pending_approval',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Project Stages
CREATE TABLE IF NOT EXISTS public.project_stages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    stage_type stage_type NOT NULL,
    status stage_status DEFAULT 'pending_submission',
    assigned_reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Stage Submissions (Version Control for Files)
CREATE TABLE IF NOT EXISTS public.stage_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stage_id UUID REFERENCES public.project_stages(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    status submission_status DEFAULT 'under_review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Comments & Feedback
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id UUID REFERENCES public.stage_submissions(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    comment_text TEXT NOT NULL,
    page_number INTEGER,
    x_coordinate NUMERIC,
    y_coordinate NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Add Row Level Security (RLS) basics (You can refine these later)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Expose simple SELECT policies for authenticated users
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all users" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all users" ON public.project_stages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all users" ON public.stage_submissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for all users" ON public.comments FOR SELECT USING (auth.role() = 'authenticated');
