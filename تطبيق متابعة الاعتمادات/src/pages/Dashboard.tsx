import { useState, useEffect, useCallback } from 'react';
import { FolderKanban, CheckCircle2, AlertCircle, FileEdit, PlusCircle, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SubmitSchematicModal } from '../components/SubmitSchematicModal';

export const Dashboard = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    
    const [stats, setStats] = useState({
        activeProjects: 0,
        underReview: 0,
        approved: 0,
        rejected: 0
    });

    const [recentActivities, setRecentActivities] = useState<any[]>([]);

    const loadDashboardData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // 1. Fetch Projects for KPIs
            let pQuery = supabase.from('projects').select('id, status');
            if (user.role === 'consultant') pQuery = pQuery.eq('consultant_id', user.id);
            const { data: pData, error: pError } = await pQuery;
            if (pError) throw pError;
            
            const activeProjects = pData ? pData.filter((p:any) => p.status !== 'completed' && p.status !== 'cancelled').length : 0;

            // 2. Fetch Submissions for KPIs and Recent Activities
            let sQuery = supabase.from('stage_submissions').select(`
                id, 
                status, 
                created_at, 
                project_stages (
                    stage_type, 
                    projects (
                        name, 
                        consultant_id
                    )
                )
            `);
            const { data: sData, error: sError } = await sQuery;
            if (sError) throw sError;
            
            // Filter submissions if consultant
            let relevantSubmissions = sData as any[];
            if (user.role === 'consultant' && sData) {
                relevantSubmissions = sData.filter((s:any) => s.project_stages?.projects?.consultant_id === user.id);
            }
            
            if (relevantSubmissions) {
                const underReview = relevantSubmissions.filter((s:any) => s.status === 'under_review').length;
                const approved = relevantSubmissions.filter((s:any) => s.status === 'approved').length;
                const rejected = relevantSubmissions.filter((s:any) => s.status === 'rejected').length;
                setStats({ activeProjects, underReview, approved, rejected });
                 
                const activities = relevantSubmissions
                    .sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 4)
                    .map((s:any, idx) => {
                        let text = '';
                        let type = s.status === 'approved' ? 'approved' : s.status === 'rejected' ? 'rejected' : 'pending';
                        let pName = s.project_stages?.projects?.name || 'مشروع';
                        let sType = s.project_stages?.stage_type || 'مخطط';
                        
                        let sNameAr = sType === 'architectural' ? 'معماري' : 
                                      sType === 'structural' ? 'إنشائي' : 
                                      sType === 'mep' ? 'كهروميكانيكي' : 
                                      sType === 'civil_defense' ? 'دفاع مدني' : 'تخطيطي';
                         
                        if (s.status === 'approved') text = `تم اعتماد المخطط ال${sNameAr} لـ ${pName}`;
                        else if (s.status === 'rejected') text = `تم رفض المخطط ال${sNameAr} لـ ${pName}`;
                        else text = `تم تقديم المخطط ال${sNameAr} لـ ${pName} وهو قيد المراجعة`;
                         
                        let time = new Date(s.created_at).toLocaleDateString('ar-AE', { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' });
                         
                        return { id: s.id || idx, text, type, time };
                    });
                setRecentActivities(activities);
            }

        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const handleModalClose = () => {
        setIsSubmitModalOpen(false);
        // Refresh dashboard data after a submission
        loadDashboardData();
    };

    const StatCard = ({ title, value, icon: Icon, colorClass, gradientClass, subtext }: any) => (
        <div className="glass-card p-6 rounded-2xl flex items-start justify-between group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="z-10">
                <h3 className="text-slate-600 text-sm font-bold mb-1 font-cairo">{title}</h3>
                <p className={cn("text-4xl font-serif font-black mb-2", colorClass)}>{value}</p>
                {subtext && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{subtext}</p>}
            </div>
            <div className={cn("p-4 rounded-2xl shadow-lg z-10 transition-transform group-hover:rotate-12", gradientClass)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    );

    if (isLoading) return <div className="p-12 text-center text-slate-500 font-cairo">جاري تحميل لوحة القيادة...</div>;

    return (
        <div className="space-y-8 font-cairo">
            {/* Header Area with Call to Action */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div>
                     <h2 className="text-2xl font-black text-emerald-900">أهلاً بك، {user?.name || 'المهندس'}</h2>
                     <p className="text-slate-500 text-sm mt-1">إليك ملخص سريع لحالة المشاريع والاعتمادات الخاصة بك.</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-primary flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white px-6 py-2.5 rounded-xl hover:shadow-lg transition-all shadow-md">
                        <PlusCircle className="w-5 h-5" />
                        <span>فتح مشروع جديد</span>
                    </button>
                    <button 
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="btn-secondary flex items-center gap-2 bg-amber-100 text-amber-800 px-6 py-2.5 rounded-xl hover:bg-amber-200 transition-all font-bold shadow-sm"
                    >
                        <FileEdit className="w-5 h-5" />
                        <span>تقديم مخطط</span>
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="المشاريع النشطة" 
                    value={stats.activeProjects} 
                    icon={FolderKanban} 
                    colorClass="text-emerald-900" 
                    gradientClass="bg-gradient-to-br from-slate-700 to-slate-900" 
                    subtext="مشاريع قيد العمل" 
                />
                <StatCard 
                    title="مخططات قيد المراجعة" 
                    value={stats.underReview} 
                    icon={Activity} 
                    colorClass="text-amber-600" 
                    gradientClass="bg-gradient-to-br from-amber-400 to-amber-600" 
                    subtext="بانتظار الاعتماد" 
                />
                <StatCard 
                    title="المخططات المعتمدة" 
                    value={stats.approved} 
                    icon={CheckCircle2} 
                    colorClass="text-emerald-600" 
                    gradientClass="bg-gradient-to-br from-emerald-500 to-teal-600" 
                    subtext="اكتملت المراجعة" 
                />
                <StatCard 
                    title="مرفوضة / تحتاج تعديل" 
                    value={stats.rejected} 
                    icon={AlertCircle} 
                    colorClass="text-red-500" 
                    gradientClass="bg-gradient-to-br from-red-500 to-rose-600" 
                    subtext="ملاحظات قيد الانتظار" 
                />
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                        <h3 className="font-bold text-emerald-900 text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5 text-amber-500" />
                            الجدول الزمني للنشاطات
                        </h3>
                    </div>
                    <div className="space-y-6">
                        {recentActivities.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">لا توجد نشاطات حديثة حتى الآن.</div>
                        ) : recentActivities.map((activity) => (
                            <div key={activity.id} className="flex gap-4 items-start relative before:absolute before:right-[19px] before:top-10 before:bottom-[-24px] before:w-[2px] before:bg-slate-100 last:before:hidden">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white",
                                    activity.type === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                    activity.type === 'pending' ? 'bg-amber-100 text-amber-600' :
                                    'bg-red-100 text-red-600'
                                )}>
                                    {activity.type === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : 
                                     activity.type === 'pending' ? <FileEdit className="w-5 h-5" /> : 
                                     <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl flex-1 hover:shadow-md transition-all border border-slate-100/50">
                                    <p className="text-sm font-bold text-slate-700">{activity.text}</p>
                                    <span className="text-[11px] text-slate-400 mt-2 block font-medium">{activity.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Panel */}
                <div className="bg-gradient-to-b from-emerald-900 to-emerald-950 rounded-3xl p-6 shadow-lg text-white">
                    <h3 className="font-bold text-amber-400 text-lg mb-4">تعليمات الدائرة</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                            <h4 className="font-bold mb-1 text-sm text-emerald-100">تحديث إرشادات الاعتماد</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">يرجى التأكد من مطابقة جميع المخططات المعمارية لدليل تصميم المساجد المحدث في إمارة الشارقة لعام 2026 تجنباً للتأخير.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                            <h4 className="font-bold mb-1 text-sm text-emerald-100">حالة النظام</h4>
                            <p className="text-xs text-slate-300 leading-relaxed flex items-center gap-2 mt-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                متصل بقاعدة البيانات بنجاح
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <SubmitSchematicModal 
                isOpen={isSubmitModalOpen} 
                onClose={handleModalClose} 
            />
        </div>
    );
};
