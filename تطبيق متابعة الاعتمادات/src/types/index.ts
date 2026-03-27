export type UserRole = 'admin' | 'engineer' | 'consultant';
export type ProjectStatus = 'draft' | 'pending_approval' | 'under_construction' | 'completed' | 'cancelled';
export type StageType = 'architectural' | 'structural' | 'mep' | 'civil_defense' | 'planning';
export type StageStatus = 'pending_submission' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_modification';
export type SubmissionStatus = 'under_review' | 'approved' | 'rejected';

export interface Profile {
  id: string; // matches auth.users.id
  full_name: string;
  role: UserRole;
  company_name?: string;
  phone_number?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  project_number: string;
  name: string;
  description?: string;
  plot_number: string;
  region: string;
  land_area: number;
  consultant_id: string; // Profile ID
  assigned_engineer_id?: string; // Profile ID
  status: ProjectStatus;
  progress: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectStage {
  id: string;
  project_id: string; // Project ID
  stage_type: StageType;
  status: StageStatus;
  assigned_reviewer_id?: string; // Profile ID
  approval_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StageSubmission {
  id: string;
  stage_id: string; // ProjectStage ID
  version_number: number;
  submitted_by: string; // Profile ID
  file_url: string;
  status: SubmissionStatus;
  created_at?: string;
}

export interface Comment {
  id: string;
  submission_id: string; // StageSubmission ID
  author_id: string; // Profile ID
  comment_text: string;
  page_number?: number;
  x_coordinate?: number;
  y_coordinate?: number;
  created_at?: string;
}

// Temporary mock data mapping for UI fallback
export const MOCK_PROJECTS: any[] = [];
