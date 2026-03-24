import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderKanban,
    Menu,
    X,
    Bell,
    LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'الشاشة الرئيسية', path: '/' },
    { icon: FolderKanban, label: 'المشروعات', path: '/projects' },
];

export const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { user, logout } = useAuth();
    const { notifications, markAsRead } = useNotifications();
    const navigate = useNavigate();

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-brand-beige flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-white p-4 flex items-center justify-between shadow-sm z-20 sticky top-0">
                <div className="flex items-center gap-2">
                    <div className="h-14">
                        <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-brand-emerald leading-none">إدارة بناء ورعاية المساجد</span>
                        <span className="font-serif font-bold text-slate-800 text-sm mt-0.5">نظام اعتماد المخططات</span>
                    </div>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-600 hover:text-brand-gold">
                    {isSidebarOpen ? <X /> : <Menu />}
                </button>
            </div>

            <aside className={cn(
                "fixed inset-y-0 right-0 z-30 w-72 bg-white shadow-2xl transform transition-transform duration-500 md:relative md:translate-x-0 md:shadow-none border-l border-brand-gold/20 islamic-pattern",
                isSidebarOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-6 border-b border-brand-gold/10 flex flex-col items-center text-center gap-1 bg-white/80 backdrop-blur-sm">
                    <div className="w-28 h-28">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[13px] font-black text-brand-emerald">إدارة بناء ورعاية المساجد</p>
                    <p className="text-sm font-serif font-bold text-brand-gold">نظام اعتماد المخططات</p>
                </div>

                <nav className="p-4 space-y-1">
                    {sidebarItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive
                                    ? "emerald-gradient text-white shadow-lg shadow-brand-emerald/20 font-medium"
                                    : "text-slate-500 hover:bg-brand-emerald/5 hover:text-brand-emerald"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn("w-5 h-5", !isActive && "group-hover:text-brand-gold")} />
                                    <span className="font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-brand-gold/10 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-brand-beige transition-all group relative border border-transparent hover:border-brand-gold/20">
                        <div className="w-11 h-11 rounded-full bg-brand-emerald/10 p-0.5 border-2 border-brand-gold/30 overflow-hidden shrink-0">
                            <img src={user?.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 truncate">{user?.name}</h4>
                            <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest opacity-80">
                                {user?.role === 'manager' ? 'مدير النظام' :
                                    user?.role === 'engineer' ? 'مهندس' : 'استشاري'}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="تسجيل الخروج"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto md:p-8 p-4">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">مرحباً بك 👋</h2>
                        <p className="text-slate-500 mt-1">نظرة عامة على المشاريع الجارية</p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="relative p-2.5 text-slate-500 hover:text-brand-emerald transition-all glass-card rounded-xl border-brand-gold/10 hover:border-brand-gold/30 group"
                        >
                            <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-brand-gold rounded-full border-2 border-white shadow-sm animate-pulse"></span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotificationsOpen && (
                            <div className="absolute left-0 mt-3 w-85 glass-card rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 border-brand-gold/20">
                                <div className="p-4 border-b border-brand-gold/10 bg-brand-emerald text-white flex justify-between items-center">
                                    <h3 className="font-serif font-bold text-lg">التنبيهات</h3>
                                    <span className="text-[10px] bg-brand-gold text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                                        {unreadCount} جديدة
                                    </span>
                                </div>
                                <div className="max-h-96 overflow-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400">لا توجد تنبيهات جديدة</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => {
                                                        markAsRead(n.id);
                                                        setIsNotificationsOpen(false);
                                                        navigate(`/projects/${n.projectId}`);
                                                    }}
                                                    className={cn(
                                                        "p-4 hover:bg-slate-50 cursor-pointer transition-colors border-r-4",
                                                        n.isRead ? "border-transparent" : "border-teal-500 bg-teal-50/30"
                                                    )}
                                                >
                                                    <p className="text-xs font-bold text-teal-600 mb-1">{n.projectName}</p>
                                                    <p className="text-sm text-slate-700 leading-relaxed mb-1">{n.message}</p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {new Date(n.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <Outlet />
            </main>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};
