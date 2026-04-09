import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, Filter, X, Calendar as CalendarIcon, Trash2, AlertCircle } from 'lucide-react';
import { MOCK_USERS } from '../mocks/users';
import type { ProjectStatus, Project } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';
import { sendToWebhook } from '../lib/webhook';
import { sendWelcomeEmail } from '../lib/email';

export const StatusBadge = ({ status }: { status: ProjectStatus }) => {
    const styles = {
        pending_approval: 'bg-brand-gold/10 text-brand-gold ring-brand-gold/30',
        under_construction: 'bg-blue-50 text-blue-700 ring-blue-700/10',
        completed: 'bg-brand-emerald/10 text-brand-emerald ring-brand-emerald/30',
        delayed: 'bg-red-50 text-red-700 ring-red-600/10',
    };

    const labels = {
        pending_approval: 'قيد الاعتماد',
        under_construction: 'قيد التنفيذ',
        completed: 'مكتمل',
        cancelled: 'ملغي',
    };

    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset shadow-sm",
            styles[status as keyof typeof styles] || styles.pending_approval
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full ml-1.5",
                status === 'completed' ? "bg-brand-emerald" :
                    status === 'pending_approval' ? "bg-brand-gold" :
                        "bg-blue-500"
            )}></span>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
};

export const Projects = () => {
    const { user } = useAuth();
    const location = useLocation();
    const basePath = location.pathname.startsWith('/approvals') ? '/approvals' : '/projects';
    const { addNotification } = useNotifications();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<{
        type: 'region' | 'consultants' | 'project' | 'all_projects' | 'all_applications';
        title: string;
        message: string;
        region?: string;
        projectId?: string;
        projectName?: string;
    } | null>(null);
    const role = user?.role;

    // Fetch projects from Supabase
    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (user?.role !== 'manager' && user?.role !== 'engineer') {
                query = query.eq('consultant_id', user?.id);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Map Supabase data to our Project interface (names now match)
            const mappedProjects: Project[] = data.map(p => ({
                ...p,
                project_number: p.project_number || p.plot_number,
                name: p.mosque_name || p.name
            }));

            setProjects(mappedProjects);
        } catch (err: any) {
            console.error('Projects Fetch Error:', err);
            alert(`خطأ في تحميل المشاريع: ${err.message || 'فشل الاتصال بالخادم'}`);
        } finally {
            setIsLoading(false);
        }
    };


    // Fetching consultants and engineers from mock data
    const engineersList = MOCK_USERS.filter(u => u.role === 'engineer');

    useEffect(() => {
        if (user) {
            fetchProjects();
        }
    }, [user]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({
        region: '',
        plotNumber: '',
        startDate: '',
        consultantId: '',
        consultantName: '',
        consultantEmail: '',
        supervisingEngineer: ''
    });


    const generateRandomPassword = (length = 8) => {
        const charset = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous characters
        return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
    };

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let finalConsultantId = role === 'consultant' ? (user?.id || '') : newProject.consultantId;
            let finalConsultantName = role === 'consultant' ? (user?.name || '') : newProject.consultantName;
            let newUserCredentials = null;

            // If manager creates, always check/create a user account
            if (role !== 'consultant') {
                const cleanName = newProject.consultantName.trim();
                const email = newProject.consultantEmail.trim() || `${cleanName.replace(/\s+/g, '.').toLowerCase()}@cons.ae`;
                const password = generateRandomPassword(10);

                // 1. Insert into app_users
                const { data: userData, error: userError } = await supabase
                    .from('app_users')
                    .insert({
                        name: cleanName,
                        email: email,
                        password: password,
                        role: 'consultant'
                    })
                    .select()
                    .single();

                if (userError) {
                    if (userError.code === '23505') { // Unique violation
                        // Handle existing user
                        const { data: existingUser } = await supabase
                            .from('app_users')
                            .select('id, name')
                            .eq('email', email)
                            .single();

                        if (existingUser) {
                            finalConsultantId = existingUser.id;
                            finalConsultantName = existingUser.name;
                        } else {
                            throw new Error('فشل التنسيق مع حساب الاستشاري الموجود مسبقاً');
                        }
                    } else {
                        console.error('User Creation Error:', userError);
                        alert('تحذير: لم يتم إنشاء حساب دخول لهذا الاستشاري. سيتم إنشاء المشروع ببيانات نصية فقط.');
                        finalConsultantId = 'manual_' + Date.now();
                    }
                } else {
                    finalConsultantId = userData.id;
                    finalConsultantName = userData.name;
                    newUserCredentials = { email, password };
                }
            }

            // The manual duplicate check is removed to let Supabase handle constraints directly
            // and to avoid issues where the check might return a false positive or fail due to RLS.

            const projectData = {
                mosque_name: `قسيمة ${newProject.plotNumber}`,
                region: newProject.region,
                plot_number: newProject.plotNumber,
                location: newProject.region,
                consultant_name: finalConsultantName,
                consultant_id: finalConsultantId,
                status: 'pending_approval',
                progress: 0,
                start_date: newProject.startDate,
                last_update: new Date().toLocaleDateString('ar-EG'),
                supervising_engineer: newProject.supervisingEngineer
            };

            const { data: projectRecord, error: projectError } = await supabase
                .from('projects')
                .insert(projectData)
                .select()
                .single();

            if (projectError) throw projectError;

            // Initialize new 9 stages for the project
            const newStagesList = [
                { name: 'اعتماد الدفاع المدني', description: 'يرجى رفع مخطط الدفاع المدني', type: 'civil_defense' },
                { name: 'اعتماد المياة', description: 'يرجى رفع مخطط المياة', type: 'mep' },
                { name: 'اعتماد الغاز', description: 'يرجى رفع مخطط الغاز', type: 'mep' },
                { name: 'اعتماد صحي', description: 'يرجى رفع المخطط الصحي', type: 'mep' },
                { name: 'اعتماد كهرباء', description: 'يرجى رفع المخطط الكهربائي', type: 'mep' },
                { name: 'اعتماد إنشائي', description: 'يرجى رفع المخطط الإنشائي', type: 'structural' },
                { name: 'اعتماد معماري', description: 'يرجى رفع المخطط المعماري', type: 'architectural' },
                { name: 'اعتماد اتصالات', description: 'يرجى رفع مخطط الاتصالات', type: 'mep' },
                { name: 'اعتماد تخطيط ومساحة', description: 'يرجى رفع مخطط التخطيط والمساحة', type: 'planning' },
                { name: 'ضمان الاصباغ الداخلية والخارجية', description: 'يرجى رفع ضمان الاصباغ', type: 'paint' },
                { name: 'ضمان التكييف', description: 'يرجى رفع ضمان التكييف', type: 'ac' },
                { name: 'ضمان العزل', description: 'يرجى رفع ضمان العزل', type: 'insulation' },
            ];

            const stagesData = newStagesList.map((s, index) => ({
                project_id: projectRecord.id,
                name: s.name,
                stage_type: s.type,
                status: 'pending',
                description: s.description,
                stage_order: index
            }));

            const { error: stagesError } = await supabase
                .from('project_stages')
                .insert(stagesData);

            if (stagesError) throw stagesError;

            // Notify Manager
            addNotification({
                projectId: projectRecord.id,
                projectName: projectRecord.mosque_name,
                message: `قام الاستشاري "${user?.name}" بإنشاء مشروع جديد: ${projectRecord.region}`,
                recipientId: 'admin_1'
            });

            if (newUserCredentials) {
                // Send welcome email to the new consultant
                await sendWelcomeEmail(newUserCredentials.email, finalConsultantName, newUserCredentials.password);
                alert(`تم إنشاء المشروع وحساب الاستشاري بنجاح!\n\nبيانات الدخول للاستشاري:\nالمستخدم: ${newUserCredentials.email}\nكلمة المرور: ${newUserCredentials.password}`);
            } else {
                alert('تم إنشاء المشروع بنجاح!');
            }
            setIsModalOpen(false);
            setNewProject({
                region: '',
                plotNumber: '',
                startDate: '',
                consultantId: '',
                consultantName: '',
                consultantEmail: '',
                supervisingEngineer: ''
            });
            fetchProjects(); // Refresh list

            // Send data to n8n webhook
            const webhookPayload = {
                type: 'PROJECT_CREATED',
                project: {
                    id: projectRecord.id,
                    name: projectRecord.mosque_name,
                    region: projectRecord.region,
                    plot_number: projectRecord.plot_number,
                    consultant: {
                        id: finalConsultantId,
                        name: finalConsultantName
                    },
                    created_by: user?.email,
                    created_at: new Date().toISOString()
                }
            };
            sendToWebhook(webhookPayload);
        } catch (err: any) {
            console.error('Error creating project:', err);
            alert(`خطأ في إنشاء المشروع: ${err.message || JSON.stringify(err)}`);
        }
    };

    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const regions = Array.from(new Set(projects.map(p => p.region))).sort();

    const handleClearByRegion = async (region: string) => {
        setConfirmDelete({
            type: 'region',
            title: `مسح منطقة (${region})`,
            message: `هل أنت متأكد من مسح كافة المشاريع في منطقة (${region})؟ لا يمكن التراجع عن هذا الإجراء.`,
            region
        });
    };

    const executeClearByRegion = async (region: string) => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('region', region);

            if (error) throw error;

            alert(`تم مسح بيانات منطقة ${region} بنجاح`);
            setConfirmDelete(null);
            await fetchProjects();
        } catch (err: any) {
            console.error('Error clearing region:', err);
            alert(`خطأ في مسح بيانات المنطقة: ${err.message || err.details || 'فشل الاتصال - تأكد من صلاحيات الوصول'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClearConsultants = async () => {
        setConfirmDelete({
            type: 'consultants',
            title: 'إدارة الاستشاريين',
            message: 'هل أنت متأكد من مسح كافة الاستشاريين المسجلين؟ سيتم الإبقاء على المهندسين والمدير فقط.'
        });
    };

    const executeClearConsultants = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('app_users')
                .delete()
                .eq('role', 'consultant');

            if (error) throw error;

            alert('تم مسح كافة الاستشاريين بنجاح');
            setConfirmDelete(null);
        } catch (err: any) {
            console.error('Error clearing consultants:', err);
            alert(`خطأ في مسح الاستشاريين: ${err.message || err.details || 'تفتقر للصلاحيات اللازمة أو هناك خطأ في الخادم'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteProject = async (id: string, name: string) => {
        setConfirmDelete({
            type: 'project',
            title: 'حذف مشروع',
            message: `هل أنت متأكد من حذف المشروع (${name})؟ لا يمكن التراجع عن هذا الإجراء.`,
            projectId: id,
            projectName: name
        });
    };

    const handleClearAllProjects = async () => {
        setConfirmDelete({
            type: 'all_projects',
            title: 'حذف كافة المشاريع',
            message: 'هل أنت متأكد من حذف كافة المشاريع في النظام؟ سيؤدي هذا لمسح جميع المراحل والملفات المرتبطة بها نهائياً.'
        });
    };

    const executeClearAllProjects = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .neq('region', 'INTERNAL_SYSTEM_PROTECTED'); // Delete all rows

            if (error) throw error;

            alert('تم مسح كافة المشاريع بنجاح');
            setConfirmDelete(null);
            await fetchProjects();
        } catch (err: any) {
            console.error('Error clearing all projects:', err);
            alert(`خطأ في مسح المشاريع: ${err.message || 'حدث خطأ في الخادم'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClearAllApplications = async () => {
        setConfirmDelete({
            type: 'all_applications',
            title: 'مسح طلبات الانضمام',
            message: 'هل أنت متأكد من حذف كافة طلبات انضمام الاستشاريين؟'
        });
    };

    const executeClearAllApplications = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('consultant_applications')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

            if (error) throw error;

            alert('تم مسح كافة طلبات الانضمام بنجاح');
            setConfirmDelete(null);
        } catch (err: any) {
            console.error('Error clearing applications:', err);
            alert(`خطأ في مسح الطلبات: ${err.message || 'حدث خطأ في الخادم'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const executeDeleteProject = async (id: string, name: string) => {
        setIsDeleting(true);
        try {
            // 1. Delete stages first
            await supabase
                .from('project_stages')
                .delete()
                .eq('project_id', id);

            // 2. Delete the project
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('تم حذف المشروع بنجاح');
            setConfirmDelete(null);
            await fetchProjects();
        } catch (err: any) {
            console.error('Error deleting project:', err);
            alert(`خطأ في حذف المشروع: ${err.message || err.details || 'حدث خطأ غير متوقع - قد يكون بسبب قيود قاعدة البيانات'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        (p.mosque_name || p.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.plot_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 relative">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gold/10 pb-6">
                <div>
                    <h1 className="text-3xl font-serif font-black text-brand-emerald">
                        {basePath === '/projects' ? 'طلبات المساجد الجديدة' : 'اعتماد المخططات'}
                    </h1>
                    <p className="text-brand-gold font-bold text-sm mt-1">
                        {basePath === '/projects' ? 'سجل طلبات المساجد الجديدة ومتابعة حالتها' : 'سجل المشاريع الهندسية والمعمارية للمساجد'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {basePath === '/projects' && (
                        <>
                            {(user?.role === 'manager' || user?.role === 'engineer') && (
                                <button
                                    onClick={() => setIsManageModalOpen(true)}
                                    className="flex items-center gap-2 bg-white border border-brand-gold/20 text-slate-600 hover:bg-brand-beige px-4 py-2.5 rounded-xl transition-all text-sm font-bold shadow-sm"
                                >
                                    تطهير البيانات
                                </button>
                            )}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 emerald-gradient hover:shadow-xl hover:shadow-brand-emerald/20 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-brand-emerald/10 font-bold"
                            >
                                <Plus className="w-5 h-5" />
                                <span>إضافة مشروع جديد</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Manage Data Modal (Regional Clear) */}
            {isManageModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">إدارة مسح البيانات</h2>
                                <p className="text-xs text-slate-500 mt-1">امسح المشاريع حسب المنطقة المحددة</p>
                            </div>
                            <button
                                onClick={() => setIsManageModalOpen(false)}
                                className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Clear Consultants Section */}
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 space-y-3">
                                <h3 className="text-sm font-black text-red-800 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>إدارة الاستشاريين</span>
                                </h3>
                                <p className="text-[11px] text-red-600 font-bold leading-relaxed">
                                    هذا الخيار سيقوم بحذف كافة حسابات الاستشاريين المسجلة حالياً في قاعدة البيانات. لن يتم حذف المهندسين أو المدير.
                                </p>
                                <button
                                    onClick={handleClearConsultants}
                                    disabled={isDeleting}
                                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-red-600/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    إزالة كافة الاستشاريين المسجلين
                                </button>
                                <button
                                    onClick={handleClearAllApplications}
                                    disabled={isDeleting}
                                    className="w-full py-2.5 bg-slate-800 hover:bg-black text-white rounded-xl text-xs font-black transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    إزالة كافة طلبات انضمام الاستشاريين
                                </button>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* Clear Projects Section */}
                            <div>
                                <h3 className="text-[13px] font-black text-slate-800 mb-4 px-1">مسح المشاريع حسب المنطقة</h3>
                                {regions.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 italic text-sm">لا توجد مناطق لعرضها</div>
                                ) : (
                                    <div className="space-y-3">
                                        {regions.map(region => (
                                            <div key={region} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                                <span className="font-bold text-slate-700">{region}</span>
                                                <button
                                                    onClick={() => handleClearByRegion(region)}
                                                    className="text-xs bg-white text-red-600 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-all font-bold shadow-sm"
                                                >
                                                    مسح المنطقة
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            {/* Clear All Projects Section */}
                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-3">
                                <h3 className="text-sm font-black text-orange-800 flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    <span>مسح البيانات الشامل</span>
                                </h3>
                                <p className="text-[11px] text-orange-600 font-bold leading-relaxed">
                                    سيقوم هذا الإجراء بحذف **كافة المشاريع** ومراحلها من جميع المناطق نهائياً.
                                </p>
                                <button
                                    onClick={handleClearAllProjects}
                                    disabled={isDeleting}
                                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-orange-600/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    مسح كافة المشاريع من النظام
                                </button>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                            <button
                                onClick={() => setIsManageModalOpen(false)}
                                className="text-sm font-bold text-slate-500 hover:text-slate-700"
                            >
                                إغلاق النافذة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">إضافة مشروع جديد</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddProject} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 block">المنطقة</label>
                                    <input
                                        required
                                        type="text"
                                        value={newProject.region}
                                        onChange={e => setNewProject({ ...newProject, region: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                        placeholder="مثال: المجاز"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 block">رقم القطعة</label>
                                    <input
                                        required
                                        type="text"
                                        value={newProject.plotNumber}
                                        onChange={e => setNewProject({ ...newProject, plotNumber: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                        placeholder="123/A"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block">تاريخ البدء</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        required
                                        type="date"
                                        value={newProject.startDate}
                                        onChange={e => setNewProject({ ...newProject, startDate: e.target.value })}
                                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block">المهندس المشرف</label>
                                <select
                                    required
                                    value={newProject.supervisingEngineer}
                                    onChange={e => setNewProject({ ...newProject, supervisingEngineer: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-bold text-slate-700"
                                >
                                    <option value="">-- اختر المهندس المشرف --</option>
                                    {engineersList.map(eng => (
                                        <option key={eng.id} value={eng.name}>{eng.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 block">اسم المكتب الاستشاري</label>
                                    <input
                                        required
                                        type="text"
                                        disabled={role === 'consultant'}
                                        value={role === 'consultant' ? (user?.name || '') : newProject.consultantName}
                                        onChange={e => setNewProject({ ...newProject, consultantName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-bold"
                                        placeholder="اسم المكتب هنا..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 block">إيميل الاستشاري</label>
                                    <input
                                        required
                                        type="email"
                                        disabled={role === 'consultant'}
                                        value={role === 'consultant' ? (user?.email || '') : newProject.consultantEmail}
                                        onChange={e => setNewProject({ ...newProject, consultantEmail: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-bold"
                                        placeholder="consultant@example.com"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-slate-100 mt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-bold transition-all shadow-md shadow-teal-600/20"
                                >
                                    حفظ المشروع
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3 glass-card p-4 rounded-2xl border-brand-gold/10">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gold" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="بحث باسم المسجد، المنطقة أو رقم القطعة..."
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-brand-gold/10 focus:outline-none focus:ring-4 focus:ring-brand-emerald/5 focus:border-brand-gold transition-all text-sm font-medium bg-white/50"
                    />
                </div>
                <button className="flex items-center gap-2 px-5 py-3 border border-brand-gold/20 rounded-xl text-brand-emerald hover:bg-brand-emerald/5 transition-all bg-white font-bold text-sm">
                    <Filter className="w-4 h-4" />
                    <span>تصفية المتقدمة</span>
                </button>
            </div>

            {/* Projects Table */}
            <div className="glass-card rounded-3xl border-brand-gold/10 overflow-hidden shadow-2xl shadow-brand-emerald/5">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center text-brand-emerald font-bold animate-pulse">جاري تحميل المشاريع الهندسية...</div>
                    ) : (
                        <table className="w-full text-sm text-right">
                            <thead className="emerald-gradient text-white border-b border-brand-gold/20">
                                <tr>
                                    <th className="px-6 py-5 font-serif font-bold text-base">المنطقة</th>
                                    <th className="px-6 py-5 font-bold">رقم القطعة</th>
                                    <th className="px-6 py-5 font-bold">الاستشاري</th>
                                    <th className="px-6 py-5 font-bold">الحالة</th>
                                    <th className="px-6 py-5 font-bold">نسبة الإنجاز</th>
                                    <th className="px-6 py-5 font-bold">آخر تحديث</th>
                                    <th className="px-6 py-5 font-bold text-left">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                            {searchQuery ? 'لا توجد نتائج تطابق بحثك' : 'لا توجد مشاريع مضافة حالياً'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map((project) => (
                                        <tr key={project.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {basePath === '/projects' ? (
                                                    <span>{project.region}</span>
                                                ) : (
                                                    <Link to={`${basePath}/${project.id}`} className="hover:text-teal-600 transition-colors">
                                                        {project.region}
                                                    </Link>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{project.plot_number}</td>
                                            <td className="px-6 py-4 text-slate-600">{project.consultant_name}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={project.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2.5 bg-brand-gold/10 rounded-full overflow-hidden w-24 border border-brand-gold/5">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-1000",
                                                                project.progress === 100 ? "bg-brand-emerald shadow-[0_0_8px_rgba(6,78,59,0.4)]" :
                                                                    "bg-brand-gold shadow-[0_0_8px_rgba(197,160,89,0.4)]"
                                                            )}
                                                            style={{ width: `${project.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black text-brand-emerald">{project.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{project.last_update}</td>
                                            <td className="px-6 py-4 text-left">
                                                {(user?.role === 'manager' || user?.role === 'engineer') && (
                                                    <button
                                                        onClick={() => handleDeleteProject(project.id, project.region)}
                                                        disabled={isDeleting}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
                                                        title="حذف المشروع"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {/* Confirmation Dialog */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{confirmDelete.title}</h3>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    {confirmDelete.message}
                                </p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    disabled={isDeleting}
                                    onClick={() => {
                                        if (confirmDelete.type === 'region' && confirmDelete.region) {
                                            executeClearByRegion(confirmDelete.region);
                                        } else if (confirmDelete.type === 'consultants') {
                                            executeClearConsultants();
                                        } else if (confirmDelete.type === 'project' && confirmDelete.projectId && confirmDelete.projectName) {
                                            executeDeleteProject(confirmDelete.projectId, confirmDelete.projectName);
                                        } else if (confirmDelete.type === 'all_projects') {
                                            executeClearAllProjects();
                                        } else if (confirmDelete.type === 'all_applications') {
                                            executeClearAllApplications();
                                        }
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold transition-all shadow-md shadow-red-600/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    <span>تأكيد الحذف</span>
                                </button>
                                <button
                                    disabled={isDeleting}
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
