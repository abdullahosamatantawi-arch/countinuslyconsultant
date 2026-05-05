import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Upload,
    ZoomIn,
    ZoomOut,
    Layers,
    Columns,
    CheckCircle2,
    AlertTriangle,
    Building2,
    Download,
    Check,
    X,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Loader2,
    FileText,
    ExternalLink,
    RotateCcw,
    XCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

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

interface ComparisonData {
    projectId: string;
    stageName: string;
    originalDrawingUrl: string;
    modifiedDrawingUrl: string;
    rejectionComments: string;
    projectName: string;
    timestamp: string;
}

interface ProjectRecord {
    id: string;
    region: string;
    plot_number: string;
    consultant_name: string;
    mosque_name?: string;
}

// AI Verification Result
interface AICheck {
    text: string;
    passed: boolean;
    confidence: number;
}



export const BlueprintComparison = () => {
    const { id } = useParams();
    const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
    const [zoom, setZoom] = useState(100);
    const [overlayOpacity, setOverlayOpacity] = useState(50);

    // Project-specific data loaded from localStorage
    const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
    const [allComparisons, setAllComparisons] = useState<ComparisonData[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(id || null);
    const [projectDetails, setProjectDetails] = useState<ProjectRecord | null>(null);

    // AI verification
    const [aiPhase, setAiPhase] = useState<'idle' | 'analyzing' | 'results' | 'error'>('idle');
    const [aiProgress, setAiProgress] = useState(0);
    const [aiChecks, setAiChecks] = useState<AICheck[]>([]);
    const [aiScore, setAiScore] = useState(0);

    const signatureInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Load all comparison data from localStorage
    // Load all comparison data from Supabase instead of localStorage
    useEffect(() => {
        const fetchComparisons = async () => {
            try {
                // Fetch stages join with projects where name is 'اعتماد معماري' and we have an original drawing
                const { data, error } = await supabase
                    .from('project_stages')
                    .select('*, projects(*)')
                    .eq('name', 'اعتماد معماري')
                    .not('original_drawing_url', 'is', null);

                if (error) throw error;

                if (data) {
                    const mappedComparisons: ComparisonData[] = data.map((s: any) => ({
                        projectId: s.project_id,
                        stageName: s.name,
                        originalDrawingUrl: s.original_drawing_url,
                        modifiedDrawingUrl: s.drawing_url,
                        rejectionComments: s.description?.includes('طلب تعديل') ? s.description.replace('طلب تعديل: ', '') : s.description || '',
                        projectName: s.projects?.mosque_name || s.projects?.region || 'مشروع',
                        timestamp: s.date || new Date().toISOString()
                    }));

                    setAllComparisons(mappedComparisons);

                    // If we have a specific project ID from URL, load its data
                    if (id) {
                        const projectMatch = mappedComparisons.find(c => c.projectId === id);
                        if (projectMatch) {
                            setComparisonData(projectMatch);
                            setSelectedProjectId(id);
                        }
                    } else if (mappedComparisons.length > 0) {
                        // Load the most recent one by default
                        setComparisonData(mappedComparisons[0]);
                        setSelectedProjectId(mappedComparisons[0].projectId);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch comparisons:', err);
            }
        };

        fetchComparisons();
    }, [id]);

    // Load project details from Supabase
    useEffect(() => {
        if (!selectedProjectId) return;
        const fetchProject = async () => {
            const { data } = await supabase
                .from('projects')
                .select('id, region, plot_number, consultant_name')
                .eq('id', selectedProjectId)
                .single();
            if (data) setProjectDetails(data as ProjectRecord);
        };
        fetchProject();
    }, [selectedProjectId]);

    // Auto-run AI verification when both URLs are available
    useEffect(() => {
        if (comparisonData?.originalDrawingUrl && comparisonData?.modifiedDrawingUrl && aiPhase === 'idle') {
            runAIVerification();
        }
    }, [comparisonData]);

    const selectProject = (projectId: string) => {
        const data = localStorage.getItem(`blueprint_compare_${projectId}`);
        if (data) {
            setComparisonData(JSON.parse(data));
            setSelectedProjectId(projectId);
            setAiPhase('idle');
            setAiChecks([]);
        }
    };

    const runAIVerification = async () => {
        if (!comparisonData) return;
        setAiPhase('analyzing');
        setAiProgress(0);

        // Using local proxy to avoid CORS
        const proxyPath = '/n8n-webhook';
        
        try {
            // Start a simulated progress that slows down as it reaches 90%
            let progress = 0;
            const progressInterval = setInterval(() => {
                const inc = Math.max(0.5, (95 - progress) / 10);
                progress += inc;
                setAiProgress(Math.round(progress));
            }, 1000);

            const response = await fetch(proxyPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original_drawing_url: comparisonData.originalDrawingUrl,
                    modified_drawing_url: comparisonData.modifiedDrawingUrl,
                    rejection_comments: comparisonData.rejectionComments,
                    project_id: selectedProjectId,
                    engineer_name: 'عبدالله الياسي',
                    standard_checks: [
                        'مطابقة الواجهات والمقاسات المعمارية',
                        'الاشتراطات الإنشائية',
                        'معايير إدارة بناء ورعاية المساجد'
                    ]
                })
            });

            clearInterval(progressInterval);
            
            if (!response.ok) throw new Error('Failed to reach AI Engine');
            
            const result = await response.json();
            
            // Expected response format: { score: number, checks: Array<{text, passed, confidence}> }
            // If response is nested in an array (typical for n8n), take the first item
            const data = Array.isArray(result) ? result[0] : result;

            setAiProgress(100);
            setTimeout(() => {
                setAiPhase('results');
                setAiChecks(data.checks || []);
                setAiScore(data.score || 0);
            }, 500);

        } catch (error) {
            console.error("AI Verify Error:", error);
            setAiPhase('error');
        }
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
                    setAiChecks([
                        { text: 'مطابقة الواجهات والمقاسات المعمارية', passed: true, confidence: 95 },
                        { text: 'الاشتراطات الإنشائية والهيكلية', passed: true, confidence: 92 },
                        { text: 'معايير إدارة بناء ورعاية المساجد', passed: true, confidence: 94 }
                    ]);
                    setAiScore(94);
                }, 500);
            }
        }, 400);
    };

    const exportReport = () => {
        if (!comparisonData || !aiChecks.length) return;

        const reportHeader = `التقرير الفني للتحقق من المخططات\n===============================\nالمشروع: ${comparisonData.projectName || projectDetails?.region}\nتاريخ التحقق: ${new Date().toLocaleDateString('ar-EG')}\nنسبة التطابق: ${aiScore}%\n\n`;
        const reportComments = `التعديلات المطلوبة مسبقاً من المهندس:\n${comparisonData.rejectionComments}\n\n`;
        const reportChecks = `نتائج التحقق الذكي:\n${aiChecks.map(c => `- [${c.passed ? '✓' : '✗'}] ${c.text} (نسبة الثقة: ${c.confidence}%)`).join('\n')}\n\n`;
        const reportFooter = `القرار: ${aiScore >= 80 ? 'يوصى بالاعتماد' : 'يوصى بطلب تعديلات إضافية'}\n===============================\nتم الإنشاء بواسطة نظام الاعتماد الهندسية - قسم المخططات`;

        const fullReport = reportHeader + reportComments + reportChecks + reportFooter;
        
        const blob = new Blob([fullReport], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `تقرير_التحقق_الذكي_${comparisonData.projectId.slice(0, 6)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !comparisonData) return;

        setIsUploading(true);
        try {
            const publicUrl = await uploadFile(file, `signatures/${comparisonData.projectId}`);

            const { error: updateError } = await supabase
                .from('project_stages')
                .update({
                    status: 'completed',
                    signature_url: publicUrl
                })
                .eq('project_id', comparisonData.projectId)
                .eq('name', comparisonData.stageName);

            if (updateError) throw updateError;
            
            // Also notify projects table progress
            const { data: stagesData } = await supabase.from('project_stages').select('*').eq('project_id', comparisonData.projectId);
            if (stagesData) {
                const completeCount = stagesData.filter((s:any) => s.status === 'completed').length;
                const totalCount = stagesData.length || 1;
                const newProgress = Math.round((completeCount / totalCount) * 100);
                
                await supabase.from('projects')
                    .update({ progress: newProgress, status: newProgress === 100 ? 'completed' : 'under_construction' })
                    .eq('id', comparisonData.projectId);
            }

            alert('تم اعتماد التعديلات وتوقيع المخطط بنجاح!');
            window.location.href = `/approvals/${comparisonData.projectId}`;
        } catch (err: any) {
            console.error('Signature upload error:', err);
            alert(`خطأ في رفع الاعتماد: ${err.message}`);
        } finally {
            setIsUploading(false);
            if (signatureInputRef.current) signatureInputRef.current.value = '';
        }
    };

    const hasBothVersions = comparisonData?.originalDrawingUrl && comparisonData?.modifiedDrawingUrl;
    const hasOnlyOriginal = comparisonData?.originalDrawingUrl && !comparisonData?.modifiedDrawingUrl;

    return (
        <div className="space-y-6 pb-10" dir="rtl">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 font-sans">مقارنة المخططات المعمارية</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">
                        مقارنة ذكية للمخطط المعماري الأصلي والمعدل مع تحقق ذكي AI
                    </p>
                </div>
                {comparisonData && (
                    <Link
                        to={`/approvals/${selectedProjectId}`}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة للمشروع
                    </Link>
                )}
            </div>

            {/* Project Selector — shows saved comparisons */}
            {allComparisons.length > 0 && !id && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">المشاريع التي تم رفع مخططات لها</p>
                    <div className="flex flex-wrap gap-2">
                        {allComparisons.map((c) => (
                            <button
                                key={c.projectId}
                                onClick={() => selectProject(c.projectId)}
                                className={cn(
                                    "px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                                    selectedProjectId === c.projectId
                                        ? "bg-navy text-white border-navy shadow-md"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-navy/30 hover:bg-slate-50"
                                )}
                            >
                                {c.projectName || c.projectId.slice(0, 8)}
                                {c.modifiedDrawingUrl && (
                                    <span className="mr-2 text-[9px] bg-emerald-400/20 text-emerald-600 px-1.5 py-0.5 rounded-full">نسختين</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* No Data State */}
            {!comparisonData && (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Layers className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">لا توجد مخططات للمقارنة</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                        عند رفع مخطط معماري من قبل الاستشاري، سيتم حفظه هنا تلقائياً كنسخة أصلية.
                        وعند إعادة الرفع بعد التعديل ستظهر المقارنة مع التحقق الذكي.
                    </p>
                </div>
            )}

            {/* Project Info Bar */}
            {comparisonData && projectDetails && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-navy/10 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-navy" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{projectDetails.region} - قطعة {projectDetails.plot_number}</p>
                            <p className="text-[11px] text-slate-400">الاستشاري: {projectDetails.consultant_name} • المرحلة: {comparisonData.stageName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasOnlyOriginal && (
                            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100">
                                النسخة الأصلية فقط - بانتظار التعديل
                            </span>
                        )}
                        {hasBothVersions && (
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100">
                                ✓ نسختان متوفرتان للمقارنة
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Main Workspace */}
            {comparisonData && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Canvas Area */}
                    <div className="lg:col-span-8 space-y-3">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
                                <button
                                    onClick={() => setViewMode('side-by-side')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all",
                                        viewMode === 'side-by-side'
                                            ? "bg-navy text-white shadow-md"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-white"
                                    )}
                                >
                                    <Columns className="w-4 h-4" />
                                    <span>عرض متجاور</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('overlay')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all",
                                        viewMode === 'overlay'
                                            ? "bg-navy text-white shadow-md"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-white"
                                    )}
                                    disabled={!hasBothVersions}
                                >
                                    <Layers className="w-4 h-4" />
                                    <span>عرض تطابقي</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"><ZoomOut className="w-4 h-4" /></button>
                                <span className="text-[12px] font-bold text-slate-600 min-w-[48px] text-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{zoom}%</span>
                                <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"><ZoomIn className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div className="bg-[#0d1520] rounded-2xl border border-slate-700/30 overflow-hidden relative" style={{ minHeight: '500px' }}>
                            {viewMode === 'side-by-side' ? (
                                <div className="grid grid-cols-2 gap-1 p-2" style={{ minHeight: '500px' }}>
                                    {/* Version A */}
                                    <div className="relative bg-[#111827] rounded-xl overflow-hidden flex flex-col items-center justify-center p-4">
                                        <div className="absolute top-3 right-3 bg-blue-500/90 text-white text-[10px] font-black px-3 py-1 rounded-full z-10">
                                            النسخة A - الأصلية
                                        </div>
                                        {comparisonData.originalDrawingUrl ? (
                                            <div className="flex flex-col items-center gap-3" style={{ transform: `scale(${zoom / 100})` }}>
                                                <iframe
                                                    src={comparisonData.originalDrawingUrl}
                                                    className="w-full bg-white rounded"
                                                    style={{ width: '400px', height: '420px' }}
                                                    title="Blueprint A"
                                                />
                                                <a href={comparisonData.originalDrawingUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 font-bold">
                                                    <ExternalLink className="w-3 h-3" /> فتح في نافذة جديدة
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-500">
                                                <FileText className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                                                <p className="text-xs font-bold">لم يتم رفع المخطط الأصلي</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Version B */}
                                    <div className="relative bg-[#111827] rounded-xl overflow-hidden flex flex-col items-center justify-center p-4">
                                        <div className="absolute top-3 right-3 bg-amber-500/90 text-white text-[10px] font-black px-3 py-1 rounded-full z-10">
                                            النسخة B - المعدلة
                                        </div>
                                        {comparisonData.modifiedDrawingUrl ? (
                                            <div className="flex flex-col items-center gap-3" style={{ transform: `scale(${zoom / 100})` }}>
                                                <iframe
                                                    src={comparisonData.modifiedDrawingUrl}
                                                    className="w-full bg-white rounded"
                                                    style={{ width: '400px', height: '420px' }}
                                                    title="Blueprint B"
                                                />
                                                <a href={comparisonData.modifiedDrawingUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-[10px] text-amber-400 hover:text-amber-300 font-bold">
                                                    <ExternalLink className="w-3 h-3" /> فتح في نافذة جديدة
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-500">
                                                <Upload className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                                                <p className="text-xs font-bold">بانتظار رفع المخطط المعدل</p>
                                                <p className="text-[10px] text-slate-600 mt-1">سيظهر هنا تلقائياً بعد إعادة الرفع</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Overlay View */
                                <div className="relative" style={{ minHeight: '500px' }}>
                                    <div className="absolute inset-0 opacity-10"
                                        style={{
                                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                                            backgroundSize: '30px 30px'
                                        }}
                                    />
                                    <div className="relative p-4 flex items-center justify-center" style={{ minHeight: '500px' }}>
                                        {comparisonData.originalDrawingUrl && (
                                            <div className="absolute inset-4" style={{ opacity: (100 - overlayOpacity) / 100 }}>
                                                <iframe src={comparisonData.originalDrawingUrl} className="w-full h-full bg-white rounded-lg" title="Original" />
                                            </div>
                                        )}
                                        {comparisonData.modifiedDrawingUrl && (
                                            <div className="absolute inset-4" style={{ opacity: overlayOpacity / 100 }}>
                                                <iframe src={comparisonData.modifiedDrawingUrl} className="w-full h-full bg-white rounded-lg" title="Modified" style={{ mixBlendMode: 'difference' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-4 border border-white/5 z-20">
                                        <span className="text-[11px] font-bold text-blue-400 whitespace-nowrap">A الأصلي</span>
                                        <input type="range" min="0" max="100" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="flex-1 accent-blue-500 h-1" />
                                        <span className="text-[11px] font-bold text-amber-400 whitespace-nowrap">B المعدل</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Rejection Comments */}
                        {comparisonData.rejectionComments && (
                            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                                <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    التعديلات المطلوبة من المهندس
                                </h3>
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                    <p className="text-sm text-amber-800 font-medium leading-relaxed">"{comparisonData.rejectionComments}"</p>
                                </div>
                            </div>
                        )}

                        {/* AI Verification */}
                        {hasBothVersions && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 bg-gradient-to-l from-indigo-600 to-violet-600 text-white flex items-center gap-3">
                                    <Sparkles className="w-5 h-5" />
                                    <div>
                                        <h4 className="text-sm font-black">التحقق الذكي AI</h4>
                                        <p className="text-[10px] text-white/60 font-medium">مقارنة تلقائية للتغييرات</p>
                                    </div>
                                </div>
                                <div className="p-5">
                                    {aiPhase === 'analyzing' && (
                                        <div className="text-center py-6 space-y-4">
                                            <div className="relative w-16 h-16 mx-auto">
                                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
                                                <div className="absolute inset-3 rounded-full bg-indigo-50 flex items-center justify-center">
                                                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                                                </div>
                                            </div>
                                            <p className="font-bold text-slate-700 text-sm">جاري تحليل الفروقات...</p>
                                            <div className="max-w-[200px] mx-auto">
                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                                    <span>التقدم</span><span>{aiProgress}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-l from-indigo-600 to-violet-600 rounded-full transition-all duration-300" style={{ width: `${aiProgress}%` }}></div>
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                    {aiProgress > 15 && <p className="text-[9px] text-slate-400 flex items-center gap-1"><Check className="w-2.5 h-2.5 text-emerald-500" /> قراءة المخطط الأصلي</p>}
                                                    {aiProgress > 40 && <p className="text-[9px] text-slate-400 flex items-center gap-1"><Check className="w-2.5 h-2.5 text-emerald-500" /> تحليل المخطط المعدل</p>}
                                                    {aiProgress > 70 && <p className="text-[9px] text-slate-400 flex items-center gap-1"><Check className="w-2.5 h-2.5 text-emerald-500" /> مقارنة الفروقات</p>}
                                                    {aiProgress > 90 && <p className="text-[9px] text-slate-400 flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 text-indigo-500 animate-spin" /> إعداد النتائج...</p>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {aiPhase === 'error' && (
                                        <div className="text-center py-6 space-y-4">
                                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                                                <XCircle className="w-6 h-6 text-red-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">فشل في الاتصال بمحرك AI</p>
                                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">لم نتمكن من الوصول لسير العمل في n8n. يرجى التأكد من تشغيل السيرفر والمحاولة مرة أخرى.</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button 
                                                    onClick={runAIVerification}
                                                    className="w-full px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg transition-all shadow-md"
                                                >
                                                    إعادة المحاولة (Real AI)
                                                </button>
                                                <button 
                                                    onClick={runSimulationFallback}
                                                    className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg transition-all border border-dashed border-slate-300"
                                                >
                                                    تشغيل محاكاة للعرض (Demo Only)
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {aiPhase === 'results' && (
                                        <div className="space-y-4">
                                            {/* Score */}
                                            <div className="flex justify-center">
                                                <div className={cn(
                                                    "px-5 py-3 rounded-2xl flex items-center gap-3 border",
                                                    aiScore >= 80 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                                                )}>
                                                    {aiScore >= 80 ? <ShieldCheck className="w-7 h-7 text-emerald-600" /> : <AlertTriangle className="w-7 h-7 text-amber-600" />}
                                                    <div>
                                                        <p className={cn("text-xl font-black", aiScore >= 80 ? "text-emerald-700" : "text-amber-700")}>{aiScore}%</p>
                                                        <p className="text-[9px] font-bold text-slate-500">
                                                            {aiScore >= 80 ? 'تطابق عالي' : 'تطابق جزئي'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Checks */}
                                            <div className="space-y-2">
                                                {aiChecks.map((check, i) => (
                                                    <div key={i} className={cn(
                                                        "flex items-start gap-2.5 p-3 rounded-xl border",
                                                        check.passed ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"
                                                    )}>
                                                        <div className={cn(
                                                            "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                                            check.passed ? "bg-emerald-100" : "bg-red-100"
                                                        )}>
                                                            {check.passed ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <X className="w-2.5 h-2.5 text-red-600" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn("text-[11px] font-bold", check.passed ? "text-emerald-700" : "text-red-700")}>{check.text}</p>
                                                            <p className="text-[9px] text-slate-400">ثقة: {check.confidence}%</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <button 
                                                onClick={runAIVerification}
                                                className="w-full flex items-center justify-center gap-2 py-3 text-indigo-600 hover:bg-indigo-50 text-[11px] font-bold rounded-xl transition-all"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                <span>إعادة التحقق</span>
                                            </button>
                                        </div>
                                    )}

                                    {aiPhase === 'idle' && !hasBothVersions && (
                                        <p className="text-center text-xs text-slate-400 py-4">سيبدأ التحقق تلقائياً عند توفر النسختين</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status Summary */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-700 mb-3">حالة المقارنة</h3>
                            <div className="space-y-3">
                                <div className={cn("flex items-center gap-3 p-3 rounded-xl border", comparisonData.originalDrawingUrl ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", comparisonData.originalDrawingUrl ? "bg-emerald-100" : "bg-slate-200")}>
                                        {comparisonData.originalDrawingUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="text-[10px] font-bold text-slate-400">1</span>}
                                    </div>
                                    <p className={cn("text-[12px] font-bold", comparisonData.originalDrawingUrl ? "text-emerald-700" : "text-slate-400")}>
                                        رفع المخطط الأولي من الاستشاري
                                    </p>
                                </div>
                                <div className={cn("flex items-center gap-3 p-3 rounded-xl border", comparisonData.rejectionComments ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", comparisonData.rejectionComments ? "bg-emerald-100" : "bg-slate-200")}>
                                        {comparisonData.rejectionComments ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="text-[10px] font-bold text-slate-400">2</span>}
                                    </div>
                                    <p className={cn("text-[12px] font-bold", comparisonData.rejectionComments ? "text-emerald-700" : "text-slate-400")}>
                                        طلب التعديلات من المهندس
                                    </p>
                                </div>
                                <div className={cn("flex items-center gap-3 p-3 rounded-xl border", comparisonData.modifiedDrawingUrl ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", comparisonData.modifiedDrawingUrl ? "bg-emerald-100" : "bg-slate-200")}>
                                        {comparisonData.modifiedDrawingUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="text-[10px] font-bold text-slate-400">3</span>}
                                    </div>
                                    <p className={cn("text-[12px] font-bold", comparisonData.modifiedDrawingUrl ? "text-emerald-700" : "text-slate-400")}>
                                        رفع المخطط المعدل
                                    </p>
                                </div>
                                <div className={cn("flex items-center gap-3 p-3 rounded-xl border", aiPhase === 'results' ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", aiPhase === 'results' ? "bg-emerald-100" : "bg-slate-200")}>
                                        {aiPhase === 'results' ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="text-[10px] font-bold text-slate-400">4</span>}
                                    </div>
                                    <p className={cn("text-[12px] font-bold", aiPhase === 'results' ? "text-emerald-700" : "text-slate-400")}>
                                        التحقق الذكي AI
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {hasBothVersions && aiPhase === 'results' && (
                            <div className="space-y-3">
                                <button
                                    onClick={exportReport}
                                    className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-navy text-white font-bold text-sm rounded-xl hover:bg-navy-light transition-all shadow-lg shadow-navy/20"
                                >
                                    <Download className="w-5 h-5" />
                                    <span>تصدير التقرير الفني المٌلخص</span>
                                </button>
                                
                                <input
                                    type="file"
                                    ref={signatureInputRef}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleSignatureUpload}
                                />
                                
                                <button 
                                    onClick={() => signatureInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    <span>{isUploading ? 'جاري الاعتماد...' : 'الاعتماد النهائي وإرفاق الـ PDF بعد التوقيع'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
