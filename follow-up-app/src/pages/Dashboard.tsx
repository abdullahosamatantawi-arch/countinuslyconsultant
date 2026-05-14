import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    CheckCircle2, 
    Clock, 
    Bell, 
    HardHat, 
    Eye, 
    MoreHorizontal, 
    ArrowUpDown 
} from 'lucide-react';
import { sendEmailNotification } from '../lib/email';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { KPISkeleton, DashboardTableSkeleton } from '../components/ui/Skeleton';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend
} from 'recharts';


const getStatusConfig = (status: string) => {
    switch (status) {
        case 'completed':
            return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-100', label: 'مكتمل' };
        case 'under_construction':
            return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-100', label: 'قيد الإنشاء' };
        case 'pending_approval':
            return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-100', label: 'بانتظار الاعتماد' };
        case 'cancelled':
            return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-100', label: 'ملغى' };
        default:
            return { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500', border: 'border-slate-100', label: 'مسودة' };
    }
};

export const Dashboard = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingReminders, setIsSendingReminders] = useState(false);

    const [projectsList, setProjectsList] = useState<any[]>([]);

    const [stats, setStats] = useState({
        newProposals: 0,
        approvedBlueprints: 0,
        underConstruction: 0
    });

    const loadDashboardData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            let pQuery = supabase.from('projects').select('*').order('created_at', { ascending: false });
            if (user.role === 'consultant') pQuery = pQuery.eq('consultant_id', user.id);
            const { data: pData } = await pQuery;

            if (pData) {
                setProjectsList(pData);
            }

            const newProposals = pData ? pData.filter((p: any) => p.status === 'pending_approval' || p.status === 'draft').length : 0;
            const approvedBlueprints = pData ? pData.filter((p: any) => p.status === 'completed').length : 0;
            const underConstruction = pData ? pData.filter((p: any) => p.status === 'under_construction').length : 0;

            setStats({ newProposals, approvedBlueprints, underConstruction });
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const checkAndTriggerAutoReminders = useCallback(async () => {
        if (!user || user.role !== 'manager' || projectsList.length === 0) return;

        try {
            // 1. Check last execution from Supabase
            const { data: lastLog } = await supabase
                .from('automation_logs')
                .select('created_at')
                .eq('type', 'weekly_reminder')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            const now = new Date();
            let shouldRun = false;

            if (!lastLog) {
                shouldRun = true; // First time run
            } else {
                const lastRunDate = new Date(lastLog.created_at);
                const diffDays = Math.ceil((now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays >= 7) shouldRun = true;
            }

            if (shouldRun) {
                console.log("🚀 Starting automatic weekly reminders...");
                await handleSendReminders(true); // pass true to indicate it's silent/auto
                
                // 2. Log the execution
                await supabase.from('automation_logs').insert([
                    { type: 'weekly_reminder', triggered_by: user.id }
                ]);
            }
        } catch (err) {
            console.error("Auto-reminder check failed:", err);
            // Table might not exist yet, we'll handle gracefully
        }
    }, [user, projectsList]);

    const handleSendReminders = async (isSilent = false) => {
        if (!user || user.role !== 'manager') return;
        
        if (!isSilent) setIsSendingReminders(true);
        try {
            // Find all unique consultants for active projects
            const activeProjects = projectsList.filter(p => p.status === 'under_construction' || p.status === 'pending_approval');
            const uniqueConsultantIds = Array.from(new Set(activeProjects.map(p => p.consultant_id)));
            
            if (uniqueConsultantIds.length === 0) {
                if (!isSilent) alert('لا توجد مشاريع نشطة حالياً لإرسال تنبيهات لها.');
                return;
            }

            // Fetch consultant emails
            const { data: consultants } = await supabase
                .from('app_users')
                .select('email, name')
                .in('id', uniqueConsultantIds);

            if (consultants && consultants.length > 0) {
                let successCount = 0;
                for (const consultant of consultants) {
                    const success = await sendEmailNotification('WEEKLY_REMINDER', {
                        email: consultant.email,
                        name: consultant.name,
                        message: "يرجى العلم بضرورة الإسراع في تنفيذ المخططات الهندسية وتسليمها في الوقت المحدد لضمان سير المشروع بسلاسة."
                    });
                    if (success) successCount++;
                }
                if (!isSilent) alert(`تم إرسال ${successCount} تنبيهات بنجاح إلى المكاتب الاستشارية.`);
            }
        } catch (err) {
            console.error("Reminder Error:", err);
            if (!isSilent) alert('حدث خطأ أثناء إرسال التنبيهات.');
        } finally {
            if (!isSilent) setIsSendingReminders(false);
        }
    };

    useEffect(() => { 
        loadDashboardData(); 
    }, [loadDashboardData]);

    useEffect(() => {
        if (!isLoading && projectsList.length > 0) {
            checkAndTriggerAutoReminders();
        }
    }, [isLoading, projectsList, checkAndTriggerAutoReminders]);

    const regionData = useMemo(() => {
        const counts: Record<string, number> = {};
        projectsList.forEach(p => {
            const region = p.region || 'غير محدد';
            counts[region] = (counts[region] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [projectsList]);

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        projectsList.forEach(p => {
            const statusLabel = getStatusConfig(p.status).label;
            counts[statusLabel] = (counts[statusLabel] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [projectsList]);

    const CHART_COLORS = ['#059669', '#d97706', '#2563eb', '#dc2626', '#475569'];


    const kpis = [
        {
            title: 'مشاريع جديدة قيد الدراسة',
            value: stats.newProposals || 0,
            icon: Clock,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            iconBg: 'bg-amber-500',
            borderColor: 'border-amber-100',
        },
        {
            title: 'مشاريع مكتملة',
            value: stats.approvedBlueprints || 0,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            iconBg: 'bg-emerald-500',
            borderColor: 'border-emerald-100',
        },
        {
            title: 'مساجد قيد الإنشاء',
            value: stats.underConstruction || 0,
            icon: HardHat,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            iconBg: 'bg-blue-500',
            borderColor: 'border-blue-100',
        },
    ];

    return (
        <div className="space-y-8 pb-10" dir="rtl">
            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 font-sans">لوحة التحكم</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">نظرة عامة على طلبات بناء المساجد الجديدة</p>
                </div>
                
                {user?.role === 'manager' && (
                    <button 
                        onClick={() => handleSendReminders()}
                        disabled={isSendingReminders}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        {isSendingReminders ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Bell className="w-4 h-4" />
                        )}
                        <span>إرسال تذكير أسبوعي للمكاتب</span>
                    </button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {isLoading ? (
                    <>
                        <KPISkeleton />
                        <KPISkeleton />
                        <KPISkeleton />
                    </>
                ) : (
                    kpis.map((kpi, i) => (
                        <div key={i} className={cn("bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all group", kpi.borderColor)}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-500 text-[13px] font-bold mb-3">{kpi.title}</p>
                                    <p className={cn("text-4xl font-black", kpi.color)}>{kpi.value}</p>
                                </div>
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform", kpi.iconBg)}>
                                    <kpi.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Analytics Section */}
            {!isLoading && projectsList.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Regional Distribution Chart */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-800">توزيع المشاريع حسب المناطق</h3>
                            <div className="p-2 bg-brand-emerald/10 rounded-lg">
                                <ArrowUpDown className="w-4 h-4 text-brand-emerald" />
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }}
                                        width={140}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar 
                                        dataKey="value" 
                                        fill="#059669" 
                                        radius={[0, 4, 4, 0]} 
                                        barSize={24}
                                        label={{ position: 'right', fill: '#059669', fontSize: 12, fontWeight: 900 }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Breakdown Chart */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-800">حالة خط الإنتاج</h3>
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Clock className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        align="center"
                                        formatter={(value) => <span className="text-xs font-bold text-slate-600 mr-2">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Consultant Submissions Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">طلبات الاستشاريين الواردة</h3>
                        <p className="text-[13px] text-slate-400 font-medium mt-0.5">مراجعة واعتماد مخططات المساجد الجديدة المقدمة</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100">
                            <ArrowUpDown className="w-4 h-4" />
                            <span>ترتيب</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="text-right px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-wider">اسم المشروع</th>
                                <th className="text-right px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-wider">المكتب الاستشاري</th>
                                <th className="text-right px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-wider">سعة المسجد</th>
                                <th className="text-right px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-wider">المنطقة</th>
                                <th className="text-right px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-wider">حالة الاعتماد</th>
                                <th className="text-center px-6 py-4 text-[12px] font-black text-slate-500 uppercase tracking-wider">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <>
                                    <DashboardTableSkeleton />
                                    <DashboardTableSkeleton />
                                    <DashboardTableSkeleton />
                                </>
                            ) : projectsList.length > 0 ? projectsList.map((row) => {
                                const statusConfig = getStatusConfig(row.status);
                                return (
                                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div>
                                                <p className="font-bold text-slate-800 text-[14px]">{row.mosque_name || row.name || `مشروع ${row.plot_number}`}</p>
                                                <p className="text-[12px] text-slate-400 mt-1 max-w-xs truncate">{row.description || 'لا يوجد وصف تفصيلي للمشروع'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-medium text-slate-600 text-[13px]">{row.consultant_name}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-bold text-slate-700 text-[13px]">{row.land_area ? `${row.land_area} م²` : 'غير محدد'}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-medium text-slate-600 text-[13px]">{row.region} - {row.plot_number}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold border",
                                                statusConfig.bg, statusConfig.text, statusConfig.border
                                            )}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dot)}></span>
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => window.location.href = `/approvals/${row.id}`}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-navy text-white text-[12px] font-bold rounded-lg hover:bg-navy-light transition-all shadow-sm hover:shadow-md"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>مراجعة المشروع</span>
                                                </button>
                                                <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <p className="text-sm font-bold text-slate-400">لا توجد مشاريع مسجلة بعد</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-[12px] text-slate-400 font-medium">عرض {projectsList.length} طلبات مسجلة</p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 text-[12px] font-bold text-slate-400 bg-white border border-slate-100 rounded-lg hover:bg-slate-50 transition-all">السابق</button>
                        <button className="px-3 py-1.5 text-[12px] font-bold text-white bg-navy rounded-lg">1</button>
                        <button className="px-3 py-1.5 text-[12px] font-bold text-slate-400 bg-white border border-slate-100 rounded-lg hover:bg-slate-50 transition-all">التالي</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
