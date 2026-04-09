import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderPlus,
    ClipboardCheck,
    Layers,
    Menu,
    X,
    Bell,
    LogOut,
    Search,
    ChevronLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'الرئيسية', path: '/', roles: ['manager', 'engineer', 'consultant'] },
    { icon: FolderPlus, label: 'طلبات المساجد الجديدة', path: '/projects', roles: ['manager', 'engineer', 'consultant'] },
    { icon: ClipboardCheck, label: 'اعتماد المخططات', path: '/approvals', roles: ['manager', 'engineer', 'consultant'] },
    { icon: Layers, label: 'مقارنة المخططات الهندسية', path: '/permits', roles: ['manager', 'engineer'] },
];

export const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user, logout } = useAuth();
    const { notifications, markAsRead } = useNotifications();
    const navigate = useNavigate();

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-row-reverse" dir="rtl">
            {/* Sidebar — Dark Navy */}
            <aside className={cn(
                "fixed inset-y-0 right-0 z-40 w-72 navy-gradient text-white transform transition-transform duration-500 md:relative md:translate-x-0 flex flex-col",
                isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
            )}>
                {/* Logo Area */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shrink-0">
                            <img src="/logo-light.png" alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <h1 className="text-[13px] font-bold text-white leading-tight">إدارة بناء ورعاية المساجد</h1>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">نظام اعتماد المخططات</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 sidebar-scroll overflow-y-auto mt-2">
                    {sidebarItems
                        .filter(item => !item.roles || item.roles.includes(user?.role || ''))
                        .map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group text-[14px]",
                                isActive
                                    ? "bg-white/10 text-white font-bold border border-white/5 shadow-lg shadow-black/10"
                                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                            )}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {user?.name?.charAt(0) || 'م'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                                {user?.role === 'manager' ? 'مدير إدارة بناء ورعاية المساجد' : (user?.name || 'المهندس')}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                                {user?.role === 'manager' ? 'المهندس عبدالله الياسي' :
                                    user?.role === 'engineer' ? 'مهندس' : 'استشاري'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Top Header Bar */}
                <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-xl"
                        >
                            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-xl relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث برقم القطعة أو اسم المشروع..."
                                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* Notifications Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2 left-2 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {isNotificationsOpen && (
                                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200/60 z-50 overflow-hidden border border-slate-100">
                                        <div className="px-4 py-3 bg-navy text-white font-bold flex justify-between items-center text-sm">
                                            <span>التنبيهات</span>
                                            {unreadCount > 0 && (
                                                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-auto divide-y divide-slate-50">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-sm text-slate-400">لا توجد تنبيهات جديدة</div>
                                            ) : notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => { markAsRead(n.id); setIsNotificationsOpen(false); navigate(`/projects/${n.projectId}`); }}
                                                    className={cn(
                                                        "p-4 hover:bg-slate-50 cursor-pointer transition-colors",
                                                        !n.isRead && "bg-blue-50/40 border-r-2 border-blue-500"
                                                    )}
                                                >
                                                    <p className="text-xs font-bold text-navy mb-1">{n.projectName}</p>
                                                    <p className="text-sm text-slate-600 leading-relaxed">{n.message}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Separator */}
                            <div className="hidden md:block w-px h-8 bg-slate-100"></div>

                            {/* Engineer Profile */}
                            <div className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-3 py-2 rounded-xl transition-all">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-white text-sm font-bold">
                                    {user?.name?.charAt(0) || 'م'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 leading-tight">
                                        {user?.role === 'manager' ? 'مدير إدارة بناء ورعاية المساجد' : (user?.name || 'حساب المهندس')}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {user?.role === 'manager' ? 'المهندس عبدالله الياسي' : 'حساب المهندس'}
                                    </p>
                                </div>
                                <ChevronLeft className="w-4 h-4 text-slate-300" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};
