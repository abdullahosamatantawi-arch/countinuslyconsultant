import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, MapPin, Building2, User, CheckCircle2, Circle, Clock, AlertCircle, X, FileText, Upload, Check, Eye } from 'lucide-react';
import type { ProjectStage, Project } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { MOCK_USERS } from '../mocks/users';

const sendEmailNotification = async (toEmail: string, toName: string, subject: string, message: string, projectName: string) => {
    console.log(`Attempting to send email to ${toEmail} for project ${projectName} via edge function...`);
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                to_email: toEmail,
                to_name: toName,
                subject: subject,
                message: message,
                project_name: projectName,
            }
        });

        if (error) {
            console.error('Edge Function Error:', error);
            alert(`خطأ من Supabase Edge Function: ${error.message || JSON.stringify(error)}`);
            throw error;
        }
        console.log(`Email sent successfully to ${toEmail}`, data);
    } catch (error: any) {
        console.error('Failed to send email via edge function:', error);
        alert(`فشل إرسال الإيميل: ${error.message || 'خطأ غير معروف'}`);
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
    isLast,
    onUploadDrawing,
    onUploadSignature,
    onRequestModifications,
    isAdmin,
    isConsultant,
    isEngineer
}: {
    stage: ProjectStage,
    isLast: boolean,
    onUploadDrawing: () => void,
    onUploadSignature: () => void,
    onRequestModifications: () => void,
    isAdmin: boolean,
    isConsultant: boolean,
    isEngineer: boolean
}) => {
    const statusColors = {
        completed: 'text-brand-emerald bg-brand-emerald/5 border-brand-emerald/30 shadow-sm shadow-brand-emerald/10',
        current: 'text-brand-gold bg-brand-gold/5 border-brand-gold/30 ring-4 ring-brand-gold/5',
        awaiting_approval: 'text-amber-600 bg-amber-50 border-amber-200 shadow-sm',
        pending: 'text-slate-300 bg-slate-50 border-slate-100',
        rejected: 'text-red-600 bg-red-50 border-red-200 shadow-sm',
    };

    const icons = {
        completed: CheckCircle2,
        current: Clock,
        awaiting_approval: Eye,
        pending: Circle,
        rejected: AlertCircle
    };

    const Icon = icons[stage.status as keyof typeof icons] || Clock;

    // Allow manager/engineer actions on ALL stages where a drawing is available for approval
    const isActionableStage = true;

    return (
        <div className="relative flex gap-6 pb-12 last:pb-0 group">
            {!isLast && (
                <div className={cn(
                    "absolute top-10 right-6 bottom-0 w-0.5",
                    stage.status === 'completed' ? "bg-brand-emerald/30" : "bg-slate-100"
                )} />
            )}

            <div className={cn(
                "relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300",
                statusColors[stage.status as keyof typeof statusColors]
            )}>
                <Icon className="w-6 h-6" />
            </div>

            <div className="flex-1 pt-1">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <h3 className={cn(
                            "text-xl font-serif font-black mb-1 transition-colors",
                            stage.status === 'pending' ? "text-slate-400" : "text-brand-emerald"
                        )}>
                            {stage.name}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">{stage.description}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {stage.drawingUrl && (
                                <div className="px-3 py-1.5 bg-brand-gold/10 text-brand-gold rounded-full text-[10px] font-black flex items-center gap-1.5 border border-brand-gold/20 shadow-sm">
                                    <FileText className="w-3.5 h-3.5" />
                                    تم رفع المخطط
                                </div>
                            )}
                            {stage.signatureUrl && (
                                <div className="px-3 py-1.5 bg-brand-emerald/10 text-brand-emerald rounded-full text-[10px] font-black flex items-center gap-1.5 border border-brand-emerald/20 shadow-sm">
                                    <Check className="w-3.5 h-3.5" />
                                    تم الاعتماد النهائي
                                </div>
                            )}
                        </div>
                    </div>
                    {stage.date && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            {stage.date}
                        </span>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                    {(stage.status === 'current' || stage.status === 'pending' || stage.status === 'rejected') && isConsultant && (
                        <button
                            onClick={onUploadDrawing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            {stage.status === 'rejected' ? 'إعادة رفع المخطط المعدل' : 'رفع المخطط'}
                        </button>
                    )}

                    {/* Action Buttons for Manager/Engineer */}
                    {stage.status === 'awaiting_approval' && (isAdmin || isEngineer) && (
                        <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-top-1 w-full sm:w-auto">
                            {/* View Button - Always Available */}
                            <a
                                href={stage.drawingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group flex-1"
                            >
                                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <Eye className="w-3 h-3 text-slate-600" />
                                </div>
                                <span>معاينة</span>
                            </a>

                            {/* Approve/Reject - Available for all stages for admins/engineers */}
                            {(isAdmin || isEngineer) && isActionableStage && (
                                <>
                                    <div className="relative flex-1">
                                        <button
                                            onClick={onUploadSignature}
                                            className="w-full emerald-gradient hover:shadow-xl hover:shadow-brand-emerald/30 text-white py-3 px-8 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-emerald/10 border border-white/10"
                                        >
                                            <Check className="w-6 h-6" />
                                            <span>اعتماد المخطط</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={onRequestModifications}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-red-200 flex-1"
                                    >
                                        <X className="w-5 h-5" />
                                        <span>طلب تعديلات</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Status badge for others if awaiting approval */}
                    {stage.status === 'awaiting_approval' && !isAdmin && !isEngineer && !isConsultant && (
                        <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 text-xs font-bold animate-pulse">
                            بانتظار المراجعة والاعتماد...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ProjectDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const isAdmin = user?.role === 'manager';
    const isEngineer = user?.role === 'engineer';

    const [project, setProject] = useState<Project | null>(null);
    const [stages, setStages] = useState<ProjectStage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Combined Fetch: Project + Stages in one query
            const { data, error } = await supabase
                .from('projects')
                .select(`
            *,
            stages (*)
            `)
                .eq('id', id)
                .single();

            if (error) throw error;

            setProject({
                id: data.id,
                name: data.mosque_name,
                region: data.region,
                plotNumber: data.plot_number,
                location: data.location,
                contractorName: data.contractor_name,
                consultantName: data.consultant_name,
                consultantId: data.consultant_id,
                status: data.status,
                progress: data.progress,
                startDate: data.start_date,
                lastUpdate: data.last_update,
                mosqueName: data.mosque_name,
                supervisingEngineer: data.supervising_engineer
            });

            if (data.stages) {
                // Sort stages client-side just in case
                const sortedStages = [...data.stages].sort((a, b) => a.stage_order - b.stage_order);
                setStages(sortedStages.map((s: any) => ({
                    id: s.id,
                    projectId: s.project_id,
                    name: s.name,
                    status: s.status,
                    description: s.description,
                    date: s.date,
                    drawingUrl: s.drawing_url,
                    signatureUrl: s.signature_url
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
                status: s.status,
                description: s.description,
                date: s.date,
                drawing_url: s.drawingUrl,
                signature_url: s.signatureUrl,
                stage_order: index
            }));

            const { error: sError } = await supabase
                .from('stages')
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
        } catch (err) {
            console.error('Cloud Sync Error:', err);
            alert('خطأ أثناء حفظ التغييرات');
        }
    };

    const drawingInputRef = useRef<HTMLInputElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const [activeStageId, setActiveStageId] = useState<string | null>(null);

    const [isModModalOpen, setIsModModalOpen] = useState(false);
    const [currentModStage, setCurrentModStage] = useState<string | null>(null);
    const [modDetails, setModDetails] = useState({ recipient: 'consultant', comments: '' });

    if (isLoading) return <div className="p-12 text-center text-slate-500">جاري تحميل البيانات...</div>;
    if (!project) return <div>المشروع غير موجود</div>;

    const handlePreviewUrl = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleDrawingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeStageId) {
            try {
                const publicUrl = await uploadFile(file, `drawings/${id}`);
                const newStages = stages.map(s =>
                    s.id === activeStageId
                        ? {
                            ...s,
                            drawingUrl: publicUrl,
                            status: 'awaiting_approval' as const,
                            description: s.status === 'rejected' ? 'تم إعادة الرفع بعد التعديل' : s.description
                        }
                        : s
                );
                setStages(newStages);
                await persistCloudSync(newStages);

                // 1. Notify Admin
                addNotification({
                    projectId: project.id,
                    projectName: project.mosqueName,
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
                        projectName: project.mosqueName,
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
                    projectName: project.mosqueName,
                    message: `تم اعتماد مرحلة "${newStages[stageIndex].name}" من قبل المهندس المختص.`,
                    recipientId: project.consultantId
                });

                // Send Email to Consultant
                let consultantEmail = '';
                let consultantName = '';

                const mockConsultant = MOCK_USERS.find(u => u.id === project.consultantId);
                if (mockConsultant) {
                    consultantEmail = mockConsultant.email;
                    consultantName = mockConsultant.name;
                } else {
                    // Fetch from DB if not in mock
                    const { data: dbConsultant } = await supabase
                        .from('app_users')
                        .select('email, name')
                        .eq('id', project.consultantId)
                        .single();
                    if (dbConsultant) {
                        consultantEmail = dbConsultant.email;
                        consultantName = dbConsultant.name;
                    }
                }

                if (consultantEmail) {
                    const emailMsg = `تم اعتماد مرحلة "${newStages[stageIndex].name}" في مشروع ${project.mosqueName}. يمكنك المتابعة للمرحلة التالية.`;
                    sendEmailNotification(consultantEmail, consultantName, `اعتماد مخطط: ${project.mosqueName}`, emailMsg, project.mosqueName);
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
        newStages[stageIndex] = { ...newStages[stageIndex], status: 'rejected', description: `طلب تعديل: ${modDetails.comments}`, drawingUrl: undefined };

        setStages(newStages);
        await persistCloudSync(newStages);

        addNotification({
            projectId: project.id,
            projectName: project.mosqueName,
            message: `تعديل مطلوب في مرحلة "${newStages[stageIndex].name}": ${modDetails.comments}`,
            recipientId: project.consultantId
        });

        // Send Email to Consultant
        let consultantEmail = '';
        let consultantName = '';

        console.log('Searching for consultant ID:', project.consultantId);

        const mockConsultant = MOCK_USERS.find(u => u.id === project.consultantId);
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
                .eq('id', project.consultantId)
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
            const emailMsg = `هناك تعديلات مطلوبة في مرحلة "${newStages[stageIndex].name}" لمشروع ${project.mosqueName}.\nالملاحظات: ${modDetails.comments}`;
            sendEmailNotification(consultantEmail, consultantName, `تعديلات مطلوبة: ${project.mosqueName}`, emailMsg, project.mosqueName);
        } else {
            alert('لم يتم العثور على البريد الإلكتروني للاستشاري، لن يتم إرسال إيميل.');
        }

        setIsModModalOpen(false);
        setModDetails({ recipient: 'consultant', comments: '' });
        alert('تم إرسال طلب التعديلات بنجاح');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link to="/projects" className="inline-flex items-center text-brand-gold hover:text-brand-emerald mb-6 transition-all font-bold text-sm bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-brand-gold/10 hover:border-brand-emerald/20 group">
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    العودة لسجل المشاريع
                </Link>
                <div className="glass-card rounded-3xl p-8 border-brand-gold/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 islamic-pattern opacity-10 -rotate-12 pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-3">
                                <h1 className="text-4xl font-serif font-black text-brand-emerald">{project.region}</h1>
                                <span className="px-4 py-1.5 rounded-full gold-gradient text-white text-[10px] font-black shadow-lg shadow-brand-gold/20 border border-white/10">
                                    قسيمة رقم {project.plotNumber}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-6 text-slate-600 mt-6 font-medium">
                                <div className="flex items-center gap-2.5">
                                    <MapPin className="w-4.5 h-4.5 text-brand-gold" />
                                    <span>{project.location}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Building2 className="w-4.5 h-4.5 text-brand-gold" />
                                    <span>{project.contractorName || 'لم يتم تحديد المقاول'}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <User className="w-4.5 h-4.5 text-brand-gold" />
                                    <span>{project.consultantName}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Clock className="w-4.5 h-4.5 text-brand-gold" />
                                    <span>تاريخ البدء: {project.startDate}</span>
                                </div>
                                {project.supervisingEngineer && (
                                    <div className="flex items-center gap-2 text-teal-600 font-bold">
                                        <User className="w-4 h-4" />
                                        <span>المهندس المشرف: {project.supervisingEngineer}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Circular Progress */}
                        <div className="relative z-10 flex items-center gap-6 glass-card px-8 py-5 rounded-3xl border-brand-gold/20 shadow-xl">
                            <div className="text-left">
                                <div className="text-[10px] text-brand-gold font-black uppercase tracking-widest mb-1 text-center">الإنجاز</div>
                                <div className="text-4xl font-serif font-black text-brand-emerald">
                                    {project.progress}%
                                </div>
                            </div>
                            <div className="relative flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full border-[6px] border-brand-gold/10 border-t-brand-emerald drop-shadow-md rotate-[-45deg] transition-all duration-1000"></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                    <CheckCircle2 className="w-8 h-8 text-brand-emerald" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-8 border-b pb-4 border-slate-50">سير العمل</h2>
                        <div className="max-w-2xl">
                            {stages.map((stage, index) => (
                                <StageItem
                                    key={stage.id}
                                    stage={stage}
                                    isLast={index === stages.length - 1}
                                    onUploadDrawing={() => { setActiveStageId(stage.id); drawingInputRef.current?.click(); }}
                                    onUploadSignature={() => { setActiveStageId(stage.id); signatureInputRef.current?.click(); }}
                                    onRequestModifications={() => { setCurrentModStage(stage.id); setIsModModalOpen(true); }}
                                    isAdmin={isAdmin}
                                    isConsultant={user?.role === 'consultant'}
                                    isEngineer={isEngineer}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-bold text-slate-800 mb-4">وثائق المشروع</h3>
                        {projectDocuments.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs text-slate-400">لا توجد وثائق حالياً</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {projectDocuments.map((doc, i) => (
                                    <li key={i} onClick={() => handlePreviewUrl(doc.url)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all group">
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", doc.type === 'drawing' ? "bg-blue-50 text-blue-500" : "bg-teal-50 text-teal-500")}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-slate-700 truncate">{doc.name}</div>
                                            <div className="text-[10px] text-slate-400">{doc.stageName}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <input type="file" ref={drawingInputRef} onChange={handleDrawingUpload} className="hidden" accept=".pdf" />
                        <input type="file" ref={signatureInputRef} onChange={handleSignatureUpload} className="hidden" accept=".pdf" />
                    </div>
                </div>
            </div>

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
        </div>
    );
};
