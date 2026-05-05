export type MosqueStatus = 'pending' | 'in_progress' | 'completed' | 'stopped';

export interface Mosque {
  id: string;
  plotNumber: string;
  area: string;
  region: string;
  consultant: string;
  contractor: string;
  donor?: string;
  menCapacity: number;
  womenCapacity: number;
  totalCapacity: number;
  expectedOpeningDate: string;
  currentWorks?: string;
  visitDate: string;
  completionPercentage: number;
  responsibleEngineer: string;
  status: MosqueStatus;
}

export interface AppConfig {
  spreadsheetId: string;
  sheetName: string;
  apiKey: string; // Google Sheets API key (simpler than Service Account)
  syncInterval: number; // in minutes
}

export interface User {
  username: string;
  isAuthenticated: boolean;
}
