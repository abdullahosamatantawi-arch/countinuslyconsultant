import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { FolderKanban, Clock, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const Dashboard = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProjects = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            let query = supabase.from('projects').select('*');
            if (user.role !== 'manager' && user.role !== 'engineer') {
                query = query.eq('consultant_id', user.id);
            }
            const { data, error } = await query;
            if (error) throw error;

            setProjects(data.map(p => ({
                id: p.id,
                name: p.mosque_name,
                region: p.region,
                plotNumber: p.plot_number,
                location: p.location,
                contractorName: p.contractor_name,
                consultantName: p.consultant_name,
                consultantId: p.consultant_id,
                status: p.status,
                progress: p.progress,
                startDate: p.start_date,
                lastUpdate: p.last_update,
                mosqueName: p.mosque_name
            })));
        } catch (err: any) {
            console.error('Dashboard Fetch Error:', err);
            alert(`خطأ في تحميل البيانات: ${err.message || 'فشل الاتصال بالخادم'}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const stats = {
        total: projects.length,
        pending: projects.filter(p => p.status === 'pending_approval').length,
        completed: projects.filter(p => p.status === 'completed').length,
        delayed: projects.filter(p => p.status === 'delayed').length,
        active: projects.filter(p => p.status === 'under_construction').length
    };

    const regionalStats = projects.reduce((acc: any, p) => {
        acc[p.region] = (acc[p.region] || 0) + 1;
        return acc;
    }, {});

    const recentProjects = [...projects]
        .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
        .slice(0, 4);

    const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
        <div className="glass-card p-6 rounded-2xl flex items-start justify-between group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border-brand-gold/10">
            {/* Background Decorative Motif */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-brand-gold pointer-events-none group-hover:scale-125 transition-transform duration-700">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                </svg>
            </div>
            
            <div className="z-10">
                <h3 className="text-slate-500 text-sm font-bold mb-1">{title}</h3>
                <p className="text-4xl font-serif font-black text-brand-emerald mb-2 group-hover:text-brand-gold transition-colors">{value}</p>
                {subtext && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{subtext}</p>}
            </div>
            <div className={cn("p-4 rounded-2xl shadow-lg z-10 transition-transform group-hover:rotate-12", color)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    );

    if (isLoading) return <div className="p-12 text-center text-slate-500">جاري تحميل الإحصائيات...</div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
                <StatCard title="إجمالي المشاريع" value={stats.total} icon={FolderKanban} color="emerald-gradient" subtext="إجمالي المشاريع في النظام" />
                <StatCard title="قيد الاعتماد" value={stats.pending} icon={Clock} color="gold-gradient" subtext="بانتظار مراجعة واعتماد المدير" />
                <StatCard title="قيد التنفيذ" value={stats.active} icon={FolderKanban} color="bg-blue-600" subtext="مشاريع جارية حالياً" />
                <StatCard title="مشاريع متأخرة" value={stats.delayed} icon={AlertCircle} color="bg-red-600" subtext="تتطلب اتخاذ إجراء" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute -top-10 -left-10 w-48 h-48 bg-brand-emerald/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-brand-gold/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    </div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div>
                            <h3 className="font-serif font-black text-brand-emerald text-xl">التوزيع الجغرافي للمشاريع</h3>
                            <p className="text-xs text-brand-gold font-bold mt-1">نظرة عامة على كثافة العمل في مناطق الشارقة</p>
                        </div>
                        <div className="flex gap-4 text-[10px] font-bold">
                            <span className="flex items-center gap-1.5 text-brand-emerald">
                                <span className="w-2 h-2 rounded-full bg-brand-emerald shadow-sm"></span>
                                مكتمل
                            </span>
                            <span className="flex items-center gap-1.5 text-brand-gold">
                                <span className="w-2 h-2 rounded-full bg-brand-gold shadow-sm animate-pulse"></span>
                                قيد التنفيذ
                            </span>
                        </div>
                    </div>

                    <div className="relative flex-1 min-h-[400px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
                        {/* Premium Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900/20"></div>

                        {/* Animated Grid Pattern */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#5eead4 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

                        {/* Abstract Geographic Element */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none scale-150">
                            <svg className="w-full h-full text-teal-500" viewBox="0 0 100 100" fill="currentColor">
                                <path d="M20,50 Q30,20 50,20 T80,50 T50,80 T20,50" />
                            </svg>
                        </div>

                        {/* Regions Showcase */}
                        <div className="relative h-full w-full p-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(regionalStats).map(([region, count]: any) => {
                                    const regionProjects = projects.filter(p => p.region === region);
                                    const activeCount = regionProjects.filter(p => p.status !== 'completed').length;
                                    const completedCount = regionProjects.filter(p => p.status === 'completed').length;

                                    return (
                                        <div
                                            key={region}
                                            className="group/card relative bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/10 hover:border-teal-500/30 transition-all duration-500 cursor-default"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 group-hover/card:scale-110 transition-transform">
                                                        <MapPin className="w-5 h-5 text-teal-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-base leading-none">{region}</h4>
                                                        <span className="text-[10px] text-teal-400 font-bold mt-1 inline-block">تحديث مباشر</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-2xl font-black text-white">{count}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">مشروعاً</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-slate-400 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                                        جاري: {activeCount}
                                                    </span>
                                                    <span className="text-slate-400 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                                                        مكتمل: {completedCount}
                                                    </span>
                                                </div>
                                                {/* Progress Mini Bar */}
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                                                    <div
                                                        className="h-full bg-teal-500 transition-all duration-1000"
                                                        style={{ width: `${(completedCount / count) * 100}%` }}
                                                    ></div>
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-1000"
                                                        style={{ width: `${(activeCount / count) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {Object.keys(regionalStats).length === 0 && (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
                                        <div className="p-4 rounded-full bg-slate-800/50 mb-4 border border-slate-700">
                                            <MapPin className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium">بانتظار إضافة مشاريع لعرض التوزيع</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Floating Decorative Elements */}
                        <div className="absolute top-4 right-4 pointer-events-none">
                            <div className="w-24 h-24 bg-teal-500/10 blur-3xl rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-3xl p-6 border-brand-gold/10">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-brand-gold/10">
                        <h3 className="font-serif font-black text-brand-emerald text-xl">أحدث المشاريع</h3>
                        <Link to="/projects" className="text-xs font-bold text-brand-gold hover:underline bg-brand-gold/5 px-3 py-1.5 rounded-full transition-all">عرض الكل</Link>
                    </div>
                    <div className="space-y-4">
                        {recentProjects.length === 0 ? (
                            <div className="text-center py-12">
                                <FolderKanban className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">لا توجد مشاريع مضافة حالياً</p>
                            </div>
                        ) : (
                            recentProjects.map((p) => (
                                <Link to={`/projects/${p.id}`} key={p.id} className="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0 hover:bg-slate-50 transition-colors rounded-lg p-2 -mx-2">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                        p.status === 'completed' ? "bg-teal-50 text-teal-600" :
                                            p.status === 'pending_approval' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                                    )}>
                                        {p.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-800 truncate">{p.region}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{p.name} - قسيمة {p.plotNumber}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-400 font-bold">{p.progress}%</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
