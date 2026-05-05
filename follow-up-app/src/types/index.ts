export type UserRole = 'admin' | 'engineer' | 'consultant' | 'manager';
export type ProjectStatus = 'draft' | 'pending_approval' | 'under_construction' | 'completed' | 'cancelled';
export type StageType = 'architectural' | 'structural' | 'mep' | 'civil_defense' | 'planning' | 'paint' | 'ac' | 'insulation';
export type SubmissionStatus = 'under_review' | 'approved' | 'rejected';

export interface Profile {
  id: string; // matches auth.users.id
  full_name: string;
  role: UserRole;
  company_name?: string;
  phone_number?: string;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Project {
  id: string;
  project_number?: string;
  name: string;
  description?: string;
  plot_number: string;
  region: string;
  land_area?: number;
  consultant_id: string;
  assigned_engineer_id?: string;
  status: ProjectStatus;
  progress: number;
  consultant_name?: string;
  contractor_name?: string;
  location?: string;
  start_date?: string;
  last_update?: string;
  mosque_name?: string;
  supervising_engineer?: string;
  created_at?: string;
  updated_at?: string;
}

export type StageStatus = 'pending' | 'current' | 'awaiting_approval' | 'completed' | 'rejected';

export interface ProjectStage {
  id: string;
  projectId: string; // mapped from project_id
  name: string;
  status: StageStatus;
  description?: string;
  date?: string;
  drawingUrl?: string; // mapped from drawing_url
  signatureUrl?: string; // mapped from signature_url
  originalDrawingUrl?: string; // for comparison
  stageType?: StageType | string;
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

export interface Notification {
  id: string;
  projectId: string;
  projectName: string;
  message: string;
  recipientId: string;
  isRead: boolean;
  timestamp: string;
}

// Temporary mock data mapping for UI fallback
export const MOCK_PROJECTS: any[] = [];
