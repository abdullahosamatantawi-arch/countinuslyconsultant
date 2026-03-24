export type ProjectStatus = 'pending_approval' | 'under_construction' | 'completed' | 'delayed';
export type UserRole = 'manager' | 'consultant' | 'engineer';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

export interface Project {
    id: string;
    name: string;
    mosqueName: string;
    location: string;
    consultantId: string;
    consultantName: string;
    contractorName?: string;
    plotNumber: string;
    region: string;
    status: ProjectStatus;
    progress: number;
    startDate: string;
    lastUpdate: string;
    supervisingEngineer?: string;
    consultantEmail?: string;
    stages?: ProjectStage[];
}

export interface ProjectStage {
    id: string;
    projectId: string;
    name: string;
    status: 'completed' | 'current' | 'pending' | 'rejected' | 'awaiting_approval';
    date?: string;
    description: string;
    drawingUrl?: string;
    signatureUrl?: string;
}

export interface Notification {
    id: string;
    projectId: string;
    projectName: string;
    message: string;
    recipientId: string;
    timestamp: string;
    isRead: boolean;
}

export const MOCK_STAGES: Record<string, ProjectStage[]> = {
    '1': [
        { id: 's1', projectId: '1', name: 'اعتماد الدفاع المدني', status: 'pending', description: 'يرجى رفع مخطط الدفاع المدني' },
        { id: 's2', projectId: '1', name: 'اعتماد المياة', status: 'pending', description: 'يرجى رفع مخطط المياة' },
        { id: 's3', projectId: '1', name: 'اعتماد الغاز', status: 'pending', description: 'يرجى رفع مخطط الغاز' },
        { id: 's4', projectId: '1', name: 'اعتماد صحي', status: 'pending', description: 'يرجى رفع المخطط الصحي' },
        { id: 's5', projectId: '1', name: 'اعتماد كهرباء', status: 'pending', description: 'يرجى رفع المخطط الكهربائي' },
        { id: 's6', projectId: '1', name: 'اعتماد إنشائي', status: 'pending', description: 'يرجى رفع المخطط الإنشائي' },
        { id: 's7', projectId: '1', name: 'اعتماد معماري', status: 'pending', description: 'يرجى رفع المخطط المعماري' },
        { id: 's8', projectId: '1', name: 'اعتماد اتصالات', status: 'pending', description: 'يرجى رفع مخطط الاتصالات' },
        { id: 's9', projectId: '1', name: 'اعتماد تخطيط ومساحة', status: 'pending', description: 'يرجى رفع مخطط التخطيط والمساحة' },
    ]
};

export const MOCK_PROJECTS: Project[] = [];
