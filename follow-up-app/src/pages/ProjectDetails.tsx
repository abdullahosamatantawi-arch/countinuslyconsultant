import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Building2, User, CheckCircle2, Circle, Clock, AlertTriangle, AlertCircle, X, FileText, Upload, Check, Eye, Layers, Sparkles, ShieldCheck, TriangleAlert, Loader2, Trash2, XCircle } from 'lucide-react';
import type { ProjectStage, Project } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { MOCK_USERS } from '../mocks/users';

const sendEmailNotification = async (toEmail: string, toName: string, subject: string, message: string, projectName: string) => {
    // Use relative path for Vite proxy (prevents CORS issues on localhost)
    const proxyPath = '/n8n-email-webhook';
    
    console.log(`Sending email notification to ${toEmail} via local proxy...`);
    
    try {
        const response = await fetch(proxyPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_email: toEmail,
                to_name: toName,
                subject: subject,
                message: message,
                project_name: projectName,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) throw new Error(`Status: ${response.status}`);
        console.log(`Email notification triggered successfully via n8n`);
    } catch (error: any) {
        console.error('Failed to trigger email webhook:', error);
        // Silently fail in UI but log for debugging to avoid blocking the user
    }
};

const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('mosque-docs')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('mosque-docs')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

const StageItem = ({
    stage,
    onUploadDrawing,
    onUploadSignature,
    onRequestModifications,
    isAdmin,
    isConsultant,
    isEngineer,
    projectId,
    stageIndex,
    totalStages
}: {
    stage: ProjectStage,
    onUploadDrawing: () => void,
    onUploadSignature: () => void,
    onRequestModifications: () => void,
    isAdmin: boolean,
    isConsultant: boolean,
    isEngineer: boolean,
    projectId?: string,
    stageIndex: number,
    totalStages: number
}) => {
    const statusConfig = {
        completed: { color: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'مكتمل' },
        current: { color: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-100', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'جاري العمل' },
        awaiting_approval: { color: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-100', text: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200', label: 'بانتظار الاعتماد' },
        pending: { color: 'slate', bg: 'bg-slate-300', ring: 'ring-slate-50', text: 'text-slate-400', badge: 'bg-slate-50 text-slate-400 border-slate-200', label: 'لم يبدأ' },
        rejected: { color: 'red', bg: 'bg-red-500', ring: 'ring-red-100', text: 'text-red-700', badge: 'bg-red-50 text-red-700 border-red-200', label: 'مرفوض' },
    };

    const config = statusConfig[stage.status as keyof typeof statusConfig] || statusConfig.pending;
    const icons = { completed: CheckCircle2, current: Clock, awaiting_approval: Eye, pending: Circle, rejected: AlertCircle };
    const Icon = icons[stage.status as keyof typeof icons] || Clock;
    const isActionableStage = true;
    const isArchitecturalStage = stage.name === 'اعتماد معماري';

    return (
        <div className={cn(
            "group relative rounded-2xl border transition-all duration-300 overflow-hidden",
            stage.status === 'completed' ? "bg-white border-emerald-100 hover:border-emerald-200" :
            stage.status === 'awaiting_approval' ? "bg-white border-blue-200 hover:border-blue-300 shadow-md shadow-blue-500/5" :
            stage.status === 'rejected' ? "bg-white border-red-200 hover:border-red-300" :
            "bg-white/60 border-slate-100 hover:border-slate-200"
        )}>
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Stage number & icon */}
                    <div className="flex flex-col items-center gap-1.5">
                        <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center ring-4 transition-all",
                            config.bg, config.ring,
                            stage.status === 'pending' ? "opacity-40" : ""
                        )}>
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[9px] font-black text-slate-300">{stageIndex + 1}/{totalStages}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className={cn(
                                    "font-bold text-[15px] leading-tight mb-0.5",
                                    stage.status === 'pending' ? "text-slate-400" : "text-slate-800"
                                )}>
                                    {stage.name}
                                </h3>
                                {stage.description && (
                                    <p className={cn(
                                        "text-xs leading-relaxed mt-1",
                                        stage.status === 'rejected' ? "text-red-500 font-medium" : "text-slate-400"
                                    )}>
                                        {stage.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {stage.date && (
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100">
                                        {stage.date}
                                    </span>
                                )}
                                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-lg border", config.badge)}>
                                    {config.label}
                                </span>
                            </div>
                        </div>

                        {/* Indicator badges */}
                        {(stage.drawingUrl || stage.signatureUrl) && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {stage.drawingUrl && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[10px] font-medium border border-slate-100">
                                        <FileText className="w-3 h-3" /> المخطط مرفوع
                                    </span>
                                )}
                                {stage.signatureUrl && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-medium border border-emerald-100">
                                        <Check className="w-3 h-3" /> معتمد
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action bar — only render when there are actions */}
            {(
                ((stage.status === 'current' || stage.status === 'pending' || stage.status === 'rejected') && isConsultant) ||
                (isArchitecturalStage && (isAdmin || isEngineer)) ||
                (stage.status === 'awaiting_approval' && (isAdmin || isEngineer))
            ) && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 flex flex-wrap gap-2">
                    {/* Consultant upload */}
                    {(stage.status === 'current' || stage.status === 'pending' || stage.status === 'rejected') && isConsultant && (
                        <button onClick={onUploadDrawing} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            {stage.status === 'rejected' ? 'إعادة رفع المخطط' : 'رفع المخطط'}
                        </button>
                    )}

                    {/* Blueprint Comparison */}
                    {isArchitecturalStage && (isAdmin || isEngineer) && (
                        <Link to={`/approvals/${projectId}/compare`} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm">
                            <Layers className="w-3.5 h-3.5" /> مقارنة المخططات
                        </Link>
                    )}

                    {/* Approval actions */}
                    {stage.status === 'awaiting_approval' && (isAdmin || isEngineer) && (
                        <>
                            <a href={stage.drawingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all border border-slate-200 shadow-sm">
                                <Eye className="w-3.5 h-3.5" /> معاينة
                            </a>
                            {isActionableStage && (
                                <>
                                    <button onClick={onUploadSignature} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20">
                                        <Check className="w-4 h-4" /> اعتماد المخطط
                                    </button>
                                    <button onClick={onRequestModifications} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all border border-red-200 shadow-sm">
                                        <X className="w-3.5 h-3.5" /> طلب تعديلات
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export const ProjectDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.startsWith('/approvals') ? '/approvals' : '/projects';
    const { addNotification } = useNotifications();
    const isAdmin = user?.role === 'manager';
    const isEngineer = user?.role === 'engineer';

    const [project, setProject] = useState<Project | null>(null);
    const [stages, setStages] = useState<ProjectStage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Combined Fetch: Project + Stages in one query
            const { data, error } = await supabase
                .from('projects')
                .select(`
            *,
            project_stages (*)
            `)
                .eq('id', id)
                .single();

            if (error) throw error;

            setProject(data as Project);

            if (data.project_stages) {
                // Sort stages client-side just in case
                const sortedStages = [...data.project_stages].sort((a, b) => a.stage_order - b.stage_order);
                setStages(sortedStages.map((s: any) => ({
                    id: s.id,
                    projectId: s.project_id,
                    name: s.name,
                    status: s.status,
                    description: s.description,
                    date: s.date,
                    drawingUrl: s.drawing_url,
                    signatureUrl: s.signature_url,
                    originalDrawingUrl: s.original_drawing_url,
                    stageType: s.stage_type
                })));
            }
        } catch (err: any) {
            console.error('Data Fetch Error:', err);
            alert(`خطأ في تحميل المشروع: ${err.message || 'فشل الاتصال بقاعدة البيانات'}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    useEffect(() => {
        if (!isLoading && project && id) {
            const requiredStages = [
                { name: 'اعتماد معماري', type: 'architectural' },
                { name: 'اعتماد إنشائي', type: 'structural' },
                { name: 'اعتماد كهروميكانيكي', type: 'mep' },
                { name: 'اعتماد الدفاع المدني', type: 'civil_defense' },
                { name: 'تخطيط ومساحة', type: 'planning' },
                { name: 'ضمان الاصباغ الداخلية والخارجية', type: 'paint' },
                { name: 'ضمان التكييف', type: 'ac' },
                { name: 'ضمان العزل', type: 'insulation' }
            ];

            const missingStages = requiredStages.filter(rs => !stages.find(s => s.stageType === rs.type));

            if (missingStages.length > 0) {
                const generateMissingStages = async () => {
                    // Use the current stages length as the base order
                    const baseOrder = stages.length;

                    const { error: insertError } = await supabase
                        .from('project_stages')
                        .insert(missingStages.map((stage, index) => ({
                            project_id: id,
                            name: stage.name,
                            stage_type: stage.type,
                            status: (baseOrder + index) === 0 ? 'current' : 'pending',
                            stage_order: baseOrder + index
                        })));

                    if (!insertError) {
                        fetchData();
                    }
                };
                generateMissingStages();
            }
        }
    }, [isLoading, project, stages, id]);

    const projectDocuments = stages
        .filter(s => s.drawingUrl || s.signatureUrl)
        .flatMap(s => {
            const docs = [];
            if (s.drawingUrl) docs.push({ name: `مخطط ${s.name}`, url: s.drawingUrl, type: 'drawing', stageName: s.name });
            if (s.signatureUrl) docs.push({ name: `اعتماد ${s.name}`, url: s.signatureUrl, type: 'signature', stageName: s.name });
            return docs;
        });

    const persistCloudSync = async (newStages: ProjectStage[], updatedStatus?: string) => {
        try {
            // Update Stages Table
            const stagesToUpdate = newStages.map((s, index) => ({
                id: s.id,
                project_id: id,
                name: s.name,
                stage_type: s.stageType,
                status: s.status,
                description: s.description,
                drawing_url: s.drawingUrl,
                signature_url: s.signatureUrl,
                original_drawing_url: s.originalDrawingUrl,
                stage_order: index
            }));

            const { error: sError } = await supabase
                .from('project_stages')
                .upsert(stagesToUpdate);

            if (sError) throw sError;

            // Update Project Table
            const hasAwaiting = newStages.some(s => s.status === 'awaiting_approval');
            const isCompleted = newStages.every(s => s.status === 'completed');
            const newProgress = Math.round((newStages.filter(s => s.status === 'completed').length / (newStages.length || 1)) * 100);

            let calculatedStatus = updatedStatus || project?.status || 'under_construction';
            if (hasAwaiting) calculatedStatus = 'pending_approval';
            else if (isCompleted) calculatedStatus = 'completed';
            else calculatedStatus = 'under_construction';

            const { error: pError } = await supabase
                .from('projects')
                .update({
                    status: calculatedStatus,
                    progress: newProgress,
                    last_update: new Date().toLocaleDateString('ar-EG')
                })
                .eq('id', id);

            if (pError) throw pError;
        } catch (err: any) {
            console.error('Cloud Sync Error Details:', err);
            const errMsg = err.message || err.details || 'فشل الاتصال بقاعدة البيانات';
            alert(`خطأ أثناء حفظ التغييرات: ${errMsg}`);
        }
    };

    const drawingInputRef = useRef<HTMLInputElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const [activeStageId, setActiveStageId] = useState<string | null>(null);

    const [isModModalOpen, setIsModModalOpen] = useState(false);
    const [currentModStage, setCurrentModStage] = useState<string | null>(null);
    const [modDetails, setModDetails] = useState({ recipient: 'consultant', comments: '' });

    // AI Verification State
    const [aiVerifyModal, setAiVerifyModal] = useState(false);
    const [aiPhase, setAiPhase] = useState<'analyzing' | 'results' | 'error'>('analyzing');
    const [aiProgress, setAiProgress] = useState(0);
    const [aiResults, setAiResults] = useState<{ requestedChanges: string; checks: { text: string; passed: boolean; confidence: number }[]; overallScore: number } | null>(null);
    const [pendingUploadData, setPendingUploadData] = useState<{ publicUrl: string; stageId: string; newStages: any[] } | null>(null);

    const runRealAIVerification = async (requestedComments: string, originalUrl: string, modifiedUrl: string, callback: () => void) => {
        setAiVerifyModal(true);
        setAiPhase('analyzing');
        setAiProgress(0);
        setAiResults(null);

        // Use local proxy path to avoid CORS issues on localhost
        const proxyPath = '/n8n-webhook';

        try {
            // Simulated progress while waiting for real API
            let progress = 0;
            const progressInterval = setInterval(() => {
                const inc = Math.max(0.5, (92 - progress) / 8);
                progress += inc;
                setAiProgress(Math.round(progress));
            }, 1000);

            const response = await fetch(proxyPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original_drawing_url: originalUrl,
                    modified_drawing_url: modifiedUrl,
                    rejection_comments: requestedComments,
                    project_id: id,
                    engineer_name: 'عبدالله الياسي',
                    context: 'إعادة رفع بعد الرفض'
                })
            });

            clearInterval(progressInterval);

            if (!response.ok) throw new Error('Failed to reach AI Engine');

            const result = await response.json();
            const data = Array.isArray(result) ? result[0] : result;

            setAiProgress(100);
            setTimeout(() => {
                setAiPhase('results');
                setAiResults({
                    requestedChanges: requestedComments.replace('طلب تعديل: ', ''),
                    checks: data.checks || [],
                    overallScore: data.score || 0
                });
            }, 500);

        } catch (error) {
            console.error("AI Verify Error:", error);
            setAiPhase('error');
        }

        // Store callback for when user confirms
        (window as any).__aiVerifyCallback = callback;
    };

    const runSimulationFallback = () => {
        setAiPhase('analyzing');
        setAiProgress(0);
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 15;
            setAiProgress(Math.min(100, progress));
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    setAiPhase('results');
                    setAiResults({
                        requestedChanges: 'محاكاة: تعديل الواجهات المعمارية',
                        checks: [
                            { text: 'مطابقة الواجهات والمقاسات المعمارية', passed: true, confidence: 95 },
                            { text: 'التعديلات المطلوبة من المهندس', passed: true, confidence: 92 },
                            { text: 'معايير إدارة بناء ورعاية المساجد', passed: true, confidence: 94 }
                        ],
                        overallScore: 94
                    });
                }, 500);
            }
        }, 400);
    };

    const handleAIApproveAndProceed = async () => {
        setAiVerifyModal(false);
        if (pendingUploadData) {
            setStages(pendingUploadData.newStages);
            await persistCloudSync(pendingUploadData.newStages);

            addNotification({
                projectId: project!.id,
                projectName: project!.mosque_name || project!.region,
                message: `قام الاستشاري بإعادة رفع مخطط معدل - تم التحقق بواسطة AI ✓`,
                recipientId: 'admin_1'
            });

            // Send Real-time Webhook Notification via Vite Proxy
            console.log("Notifying n8n about modified drawing upload...");
            fetch('/n8n-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'modified_drawing_upload',
                    project_name: project!.mosque_name,
                    engineer_name: 'عبدالله الياسي',
                    drawing_url: pendingUploadData.publicUrl,
                    message: `تم رفع تعديلات المخطط المعماري بعد التحقق بالذكاء الاصطناعي بنسبة ${aiResults?.overallScore}%`
                })
            }).catch(e => console.error("Webhook notification error:", e));

            alert('تم التحقق والرفع بنجاح ✓');
            setPendingUploadData(null);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-brand-emerald animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse text-sm">جاري تحميل بيانات المشروع...</p>
            </div>
        </div>
    );

    if (!project) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-sm w-full animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">المشروع غير موجود</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">عذراً، لم نتمكن من العثور على المشروع المطلوب. قد يكون قد تم حذفه أو أن الرابط غير صحيح.</p>
                <Link to={basePath} className="inline-flex items-center justify-center gap-2 w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-900 transition-all">
                    <ArrowRight className="w-4 h-4" />
                    العودة للسجل
                </Link>
            </div>
        </div>
    );

    const handlePreviewUrl = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleDrawingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeStageId) {
            try {
                const publicUrl = await uploadFile(file, `drawings/${id}`);
                const currentStage = stages.find(s => s.id === activeStageId);
                const isReuploadAfterRejection = currentStage?.status === 'rejected';
                const rejectionComments = currentStage?.description || '';

                const newStages = stages.map(s =>
                    s.id === activeStageId
                        ? {
                            ...s,
                            drawingUrl: publicUrl,
                            status: 'awaiting_approval' as const,
                            description: isReuploadAfterRejection ? 'تم إعادة الرفع بعد التعديل - تحقق AI ✓' : s.description
                        }
                        : s
                );

                if (isReuploadAfterRejection) {
                    addNotification({
                        projectId: project!.id,
                        projectName: project!.mosque_name || project!.region,
                        message: `قام الاستشاري بإعادة رفع مخطط معدل لمرحلة ${currentStage?.name}`,
                        recipientId: 'admin_1'
                    });

                    // Only Architectural triggers AI Webhook
                    if (rejectionComments.includes('طلب تعديل') && currentStage?.name === 'اعتماد معماري') {
                        setPendingUploadData({ publicUrl, stageId: activeStageId, newStages });
                        runRealAIVerification(rejectionComments, currentStage?.originalDrawingUrl || '', publicUrl, () => {});
                        return;
                    }

                    // Otherwise, just notify n8n for regular modified stages
                    fetch('/n8n-webhook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'modified_drawing_upload',
                            project_name: project!.mosque_name,
                            stage_name: currentStage?.name,
                            drawing_url: publicUrl,
                            message: `تم رفع تعديلات المخطط لمرحلة ${currentStage?.name}`
                        })
                    }).catch(e => console.error("Webhook notification error:", e));
                }

                // Persist changes
                setStages(newStages);
                await persistCloudSync(newStages);

                // Save initial drawing as Version A for future comparison (Only for Architectural)
                const stgName = currentStage?.name || '';
                if (stgName === 'اعتماد معماري') {
                    const currentOriginal = currentStage?.originalDrawingUrl;
                    if (!currentOriginal) {
                        // Capture it in state and DB
                        const updatedStages = newStages.map(s => 
                            s.id === activeStageId 
                                ? { ...s, originalDrawingUrl: publicUrl } 
                                : s
                        );
                        setStages(updatedStages);
                        await persistCloudSync(updatedStages);
                    }
                }

                // 1. Notify Admin
                addNotification({
                    projectId: project.id,
                    projectName: project.mosque_name || project.region,
                    message: `قام الاستشاري برفع مخطط جديد لمرحلة: ${newStages.find(s => s.id === activeStageId)?.name}`,
                    recipientId: 'admin_1'
                });

                // 2. Notify All Engineers
                const { data: dbEngineers } = await supabase
                    .from('app_users')
                    .select('id, email, name')
                    .eq('role', 'engineer');

                const mockEngineers = MOCK_USERS.filter(u => u.role === 'engineer' || u.role === 'manager');
                const dbEngineerIds = dbEngineers?.map(u => u.id) || [];
                const allEngineerIds = Array.from(new Set([...mockEngineers.map(u => u.id), ...dbEngineerIds]));

                allEngineerIds.forEach(engId => {
                    addNotification({
                        projectId: project.id,
                        projectName: project.mosque_name || project.region,
                        message: `قام الاستشاري برفع مخطط جديد لمرحلة: ${newStages.find(s => s.id === activeStageId)?.name}`,
                        recipientId: engId
                    });
                });

                // Removed proactive emails to engineers during drawing uploads per user request
                
                alert('تم الرفع والمزامنة بنجاح');
            } catch (err: any) {
                console.error('Upload Error:', err);
                alert(`خطأ في رفع الملف: ${err.message || 'يرجى التأكد من إنشاء مجلد mosque-docs في Supabase'}`);
            }
        }
    };

    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeStageId) {
            try {
                const publicUrl = await uploadFile(file, `signatures/${id}`);
                const stageIndex = stages.findIndex(s => s.id === activeStageId);
                if (stageIndex === -1) return;

                const newStages = [...stages];
                newStages[stageIndex] = { ...newStages[stageIndex], signatureUrl: publicUrl, status: 'completed', date: new Date().toLocaleDateString('ar-EG') };
                // Removed sequential stage lock - next stage no longer forced to "current"

                setStages(newStages);
                await persistCloudSync(newStages);

                addNotification({
                    projectId: project.id,
                    projectName: project.mosque_name || project.region,
                    message: `تم اعتماد مرحلة "${newStages[stageIndex].name}" من قبل المهندس المختص.`,
                    recipientId: project.consultant_id
                });

                // Send Email to Consultant
                let consultantEmail = '';
                let consultantName = '';

                const mockConsultant = MOCK_USERS.find(u => u.id === project.consultant_id);

                if (mockConsultant) {
                    consultantEmail = mockConsultant.email;
                    consultantName = mockConsultant.name;
                } else {
                    // Fetch from DB if not in mock
                    const { data: dbConsultant } = await supabase
                        .from('app_users')
                        .select('email, name')
                        .eq('id', project.consultant_id)
                        .single();
                    if (dbConsultant) {
                        consultantEmail = dbConsultant.email;
                        consultantName = dbConsultant.name;
                    }
                }

                if (consultantEmail) {
                    const emailMsg = `تم اعتماد مرحلة "${newStages[stageIndex].name}" في مشروع ${project.mosque_name}. يمكنك المتابعة للمرحلة التالية.`;
                    sendEmailNotification(consultantEmail, consultantName, `اعتماد مخطط: ${project.mosque_name}`, emailMsg, project.mosque_name || '');
                }

                alert('تم التوقيع والمزامنة بنجاح!');
            } catch (err: any) {
                console.error('Upload Error:', err);
                alert(`خطأ في رفع التوقيع: ${err.message}`);
            }
        }
    };

    const handleRequestModifications = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentModStage) return;

        const stageIndex = stages.findIndex(s => s.id === currentModStage);
        if (stageIndex === -1) return;

        const newStages = [...stages];
        const currentDrawingUrl = newStages[stageIndex].drawingUrl;
        newStages[stageIndex] = { 
            ...newStages[stageIndex], 
            status: 'rejected', 
            description: `طلب تعديل: ${modDetails.comments}`, 
            drawingUrl: undefined,
            originalDrawingUrl: currentDrawingUrl // Preserve original for comparison
        };

        setStages(newStages);
        await persistCloudSync(newStages);

        addNotification({
            projectId: project.id,
            projectName: project.mosque_name || project.region,
            message: `تعديل مطلوب في مرحلة "${newStages[stageIndex].name}": ${modDetails.comments}`,
            recipientId: project.consultant_id
        });

        // Send Email to Consultant
        let consultantEmail = '';
        let consultantName = '';

        console.log('Searching for consultant ID:', project.consultant_id);

        const mockConsultant = MOCK_USERS.find(u => u.id === project.consultant_id);
        if (mockConsultant) {
            console.log('Found in MOCK_USERS:', mockConsultant.email);
            consultantEmail = mockConsultant.email;
            consultantName = mockConsultant.name;
        } else {
            console.log('Not found in MOCK_USERS, searching in app_users table...');
            // Fetch from DB if not in mock
            const { data: dbConsultant, error: dbError } = await supabase
                .from('app_users')
                .select('email, name')
                .eq('id', project.consultant_id)
                .single();
            
            if (dbError) {
                console.error('Database lookup failed for consultant:', dbError);
            }

            if (dbConsultant) {
                console.log('Found in app_users table:', dbConsultant.email);
                consultantEmail = dbConsultant.email;
                consultantName = dbConsultant.name;
            } else {
                console.warn('Consultant not found in database or mock data.');
            }
        }

        if (consultantEmail) {
            const emailMsg = `هناك تعديلات مطلوبة في مرحلة "${newStages[stageIndex].name}" لمشروع ${project.mosque_name}.\nالملاحظات: ${modDetails.comments}`;
            sendEmailNotification(consultantEmail, consultantName, `تعديلات مطلوبة: ${project.mosque_name}`, emailMsg, project.mosque_name || '');
        } else {
            alert('لم يتم العثور على البريد الإلكتروني للاستشاري، لن يتم إرسال إيميل.');
        }

        setIsModModalOpen(false);
        setModDetails({ recipient: 'consultant', comments: '' });
        alert('تم إرسال طلب التعديلات بنجاح');
    };



    // Delete project from Supabase
    const handleDeleteProject = async () => {
        if (!project) return;
        const projectName = project.mosque_name || project.region || 'هذا المشروع';
        if (!window.confirm(`هل أنت متأكد من حذف المشروع (${projectName})؟\n\nسيتم حذف جميع البيانات والمخططات المرتبطة بهذا المشروع نهائياً.`)) return;

        setIsDeleting(true);
        try {
            // 1. Delete stages
            await supabase.from('project_stages').delete().eq('project_id', id);
            
            // 2. Delete the project
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;

            // 3. Clean up localStorage comparison data
            localStorage.removeItem(`blueprint_compare_${id}`);

            alert('تم حذف المشروع بنجاح');
            navigate(basePath);
        } catch (err: any) {
            console.error('Delete Error:', err);
            alert(`خطأ في حذف المشروع: ${err.message || 'حدث خطأ غير متوقع'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Back Button */}
            <Link to={basePath} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-emerald text-sm font-medium transition-colors group">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                العودة لسجل المشاريع
            </Link>

            {/* ═══════════ HERO HEADER ═══════════ */}
            <div className="relative bg-gradient-to-l from-[#0c3b2e] to-[#164e3f] rounded-3xl p-8 overflow-hidden text-white">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/[0.03] rounded-full translate-x-1/3 translate-y-1/3"></div>
                <div className="absolute top-4 left-4 islamic-pattern opacity-[0.04] w-40 h-40 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">
                    {/* Left: Project Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <h1 className="text-3xl font-bold tracking-tight">{project?.mosque_name || project?.region || 'مشروع جديد'}</h1>
                            <span className="px-3 py-1 rounded-lg bg-white/10 text-white/80 text-xs font-bold backdrop-blur-sm border border-white/10">
                                قسيمة #{project?.plot_number || '—'}
                            </span>
                            {(isAdmin || isEngineer) && (
                                <button
                                    onClick={handleDeleteProject}
                                    disabled={isDeleting}
                                    className="mr-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-bold transition-all border border-red-400/20 disabled:opacity-30"
                                >
                                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    {isDeleting ? 'جاري الحذف...' : 'حذف'}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                            {[
                                { icon: MapPin, label: 'الموقع', value: project.location || '—' },
                                { icon: User, label: 'الاستشاري', value: project.consultant_name || '—' },
                                { icon: Clock, label: 'تاريخ البدء', value: project.start_date || '—' },
                                { icon: Building2, label: 'المقاول', value: project.contractor_name || 'غير محدد' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white/[0.07] backdrop-blur-sm rounded-xl px-4 py-3 border border-white/[0.08]">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <item.icon className="w-3.5 h-3.5 text-white/40" />
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{item.label}</span>
                                    </div>
                                    <p className="text-sm font-bold text-white/90 truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {project.supervising_engineer && (
                            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-emerald-400/20">
                                <User className="w-3.5 h-3.5 text-emerald-300" />
                                <span className="text-xs font-bold text-emerald-200">المهندس المشرف: {project.supervising_engineer}</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Progress Ring */}
                    <div className="flex items-center justify-center lg:justify-end">
                        <div className="relative w-36 h-36">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#progressGradient)" strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={`${(project.progress / 100) * 327} 327`}
                                    className="transition-all duration-1000"
                                />
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#6ee7b7" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black">{project?.progress || 0}%</span>
                                <span className="text-[10px] text-white/50 font-bold">الإنجاز</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ SUMMARY STATS ═══════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                    const completed = stages.filter(s => s.status === 'completed').length;
                    const awaiting = stages.filter(s => s.status === 'awaiting_approval').length;
                    const rejected = stages.filter(s => s.status === 'rejected').length;
                    const pending = stages.filter(s => s.status === 'pending' || s.status === 'current').length;
                    return [
                        { label: 'مكتملة', value: completed, color: 'emerald', icon: CheckCircle2 },
                        { label: 'بانتظار الاعتماد', value: awaiting, color: 'blue', icon: Eye },
                        { label: 'مرفوضة', value: rejected, color: 'red', icon: AlertCircle },
                        { label: 'لم تبدأ', value: pending, color: 'slate', icon: Circle },
                    ];
                })().map((stat, i) => {
                    const StatIcon = stat.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <StatIcon className={cn("w-5 h-5", `text-${stat.color}-500`)} />
                                <span className={cn("text-2xl font-black", `text-${stat.color}-600`)}>{stat.value}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-400">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* ═══════════ MAIN CONTENT ═══════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Workflow */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">سير المراحل الهندسية</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{stages.filter(s => s.status === 'completed').length} من {stages.length} مراحل مكتملة</p>
                            </div>
                            {/* Progress bar */}
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${(stages.filter(s => s.status === 'completed').length / (stages.length || 1)) * 100}%` }}></div>
                                </div>
                                <span className="text-xs font-black text-emerald-600">{Math.round((stages.filter(s => s.status === 'completed').length / (stages.length || 1)) * 100)}%</span>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            {stages.map((stage, index) => (
                                <StageItem
                                    key={stage.id}
                                    stage={stage}
                                    onUploadDrawing={() => { setActiveStageId(stage.id); drawingInputRef.current?.click(); }}
                                    onUploadSignature={() => { setActiveStageId(stage.id); signatureInputRef.current?.click(); }}
                                    onRequestModifications={() => { setCurrentModStage(stage.id); setIsModModalOpen(true); }}
                                    isAdmin={isAdmin}
                                    isConsultant={user?.role === 'consultant'}
                                    isEngineer={isEngineer}
                                    projectId={id}
                                    stageIndex={index}
                                    totalStages={stages.length}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Documents */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-sm">وثائق المشروع</h3>
                        </div>
                        <div className="p-4">
                            {projectDocuments.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                    <p className="text-xs text-slate-400 font-medium">لا توجد وثائق مرفوعة حالياً</p>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {projectDocuments.map((doc, i) => (
                                        <li key={i} onClick={() => handlePreviewUrl(doc.url)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all group">
                                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", doc.type === 'drawing' ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-500")}>
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-slate-700 truncate">{doc.name}</div>
                                                <div className="text-[10px] text-slate-400">{doc.stageName}</div>
                                            </div>
                                            <Eye className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <input type="file" ref={drawingInputRef} onChange={handleDrawingUpload} className="hidden" accept=".pdf" />
            <input type="file" ref={signatureInputRef} onChange={handleSignatureUpload} className="hidden" accept=".pdf" />

            {isModModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">طلب تعديلات</h2>
                            <button onClick={() => setIsModModalOpen(false)} className="p-2 hover:bg-white rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleRequestModifications} className="p-6 space-y-4">
                            <textarea required rows={4} value={modDetails.comments} onChange={e => setModDetails({ ...modDetails, comments: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="اكتب ملاحظات التعديل..." />
                            <button type="submit" className="w-full bg-red-600 text-white py-2.5 rounded-xl font-bold">إرسال للتنفيذ</button>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Verification Modal */}
            {aiVerifyModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-l from-indigo-600 to-violet-600 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black">التحقق الذكي من التعديلات</h2>
                                    <p className="text-white/70 text-xs font-medium">AI Blueprint Verification</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {aiPhase === 'analyzing' && (
                                <div className="text-center py-10 space-y-6">
                                    <div className="relative w-24 h-24 mx-auto">
                                        <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-emerald animate-spin"></div>
                                        <div className="absolute inset-4 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-brand-emerald animate-pulse" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800">جاري التحقق الفعلي بالذكاء الاصطناعي...</h3>
                                        <p className="text-slate-400 text-xs mt-1 font-bold">نقوم بمقارنة المخطط الجديد مع ملاحظات المهندس عبر محرك AI</p>
                                    </div>
                                    <div className="max-w-[280px] mx-auto">
                                        <div className="flex justify-between text-[11px] font-black text-slate-500 mb-2">
                                            <span>التقدم</span>
                                            <span>{aiProgress}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-brand-emerald to-emerald-400 rounded-full transition-all duration-500"
                                                style={{ width: `${aiProgress}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {aiProgress > 35 && <p className="text-[10px] text-slate-400 flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> تحليل المخطط المعدل</p>}
                                            {aiProgress > 60 && <p className="text-[10px] text-slate-400 flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> مقارنة الفروقات الهيكلية</p>}
                                            {aiProgress > 85 && <p className="text-[10px] text-slate-400 flex items-center gap-1.5"><Loader2 className="w-3 h-3 text-indigo-500 animate-spin" /> إعداد التقرير النهائي...</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {aiPhase === 'error' && (
                                <div className="text-center py-10 space-y-6">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                                        <XCircle className="w-10 h-10 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800">فشل في الاتصال بمحرك AI</h3>
                                        <p className="text-slate-400 text-xs mt-1 font-bold leading-relaxed">لم نتمكن من الوصول لسير العمل في n8n. يرجى التأكد من أن الرابط يعمل بشكل صحيح.</p>
                                    </div>
                                    <div className="flex flex-col gap-3 w-full">
                                        <div className="flex gap-3 justify-center">
                                            <button 
                                                onClick={() => setAiVerifyModal(false)}
                                                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                                            >
                                                إلغاء
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (pendingUploadData) {
                                                        const currentStage = stages.find(s => s.id === activeStageId);
                                                        runRealAIVerification(currentStage?.description || '', currentStage?.originalDrawingUrl || '', pendingUploadData.publicUrl, () => {});
                                                    }
                                                }}
                                                className="px-6 py-2.5 bg-brand-emerald text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20"
                                            >
                                                إعادة المحاولة
                                            </button>
                                        </div>
                                        <button 
                                            onClick={runSimulationFallback}
                                            className="w-full py-3 text-[11px] text-slate-400 font-bold hover:text-brand-emerald hover:bg-slate-50 rounded-xl transition-all border border-dashed border-slate-200 mt-2"
                                        >
                                            تشغيل محاكاة للعرض (Demo Only)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {aiPhase === 'results' && (
                                <div className="space-y-5">
                                    {/* Score Badge */}
                                    <div className="flex items-center justify-center">
                                        <div className={cn(
                                            "px-6 py-3 rounded-2xl flex items-center gap-3 border",
                                            (aiResults?.overallScore || 0) >= 80
                                                ? "bg-emerald-50 border-emerald-200"
                                                : (aiResults?.overallScore || 0) >= 50
                                                    ? "bg-amber-50 border-amber-200"
                                                    : "bg-red-50 border-red-200"
                                        )}>
                                            {(aiResults?.overallScore || 0) >= 80 ? (
                                                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                                            ) : (
                                                <TriangleAlert className="w-8 h-8 text-amber-600" />
                                            )}
                                            <div>
                                                <p className={cn("text-2xl font-black",
                                                    (aiResults?.overallScore || 0) >= 80 ? "text-emerald-700" : "text-amber-700"
                                                )}>
                                                    {aiResults?.overallScore}%
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-500">
                                                    {(aiResults?.overallScore || 0) >= 80 ? 'تطابق عالي مع التعديلات المطلوبة' : 'تطابق جزئي - يرجى المراجعة'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requested Changes */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">التعديلات المطلوبة من المهندس</p>
                                        <p className="text-sm text-slate-700 font-medium leading-relaxed">" {aiResults?.requestedChanges} "</p>
                                    </div>

                                    {/* Checks */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">نتائج التحقق</p>
                                        {aiResults?.checks.map((check, i) => (
                                            <div key={i} className={cn(
                                                "flex items-start gap-3 p-3 rounded-xl border transition-all",
                                                check.passed
                                                    ? "bg-emerald-50/50 border-emerald-100"
                                                    : "bg-red-50/50 border-red-100"
                                            )}>
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                                    check.passed ? "bg-emerald-100" : "bg-red-100"
                                                )}>
                                                    {check.passed
                                                        ? <Check className="w-3 h-3 text-emerald-600" />
                                                        : <X className="w-3 h-3 text-red-600" />
                                                    }
                                                </div>
                                                <div className="flex-1">
                                                    <p className={cn("text-[12px] font-bold", check.passed ? "text-emerald-700" : "text-red-700")}>
                                                        {check.text}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">نسبة الثقة: {check.confidence}%</p>
                                                </div>
                                                <span className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 rounded-full",
                                                    check.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {check.passed ? 'تم التحقق ✓' : 'لم يتم التحقق'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleAIApproveAndProceed}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                                        >
                                            <ShieldCheck className="w-5 h-5" />
                                            <span>قبول ومتابعة الرفع</span>
                                        </button>
                                        <button
                                            onClick={() => { setAiVerifyModal(false); setPendingUploadData(null); }}
                                            className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>إلغاء</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
