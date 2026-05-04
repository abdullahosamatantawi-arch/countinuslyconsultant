import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import { 
  LayoutDashboard, 
  Landmark as MosqueIcon, 
  Settings, 
  LogOut, 
  Globe, 
  Menu, 
  X,
  Bell
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-primary text-white shadow-lg" 
        : "text-dark/70 hover:bg-primary/10 hover:text-primary"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<{ 
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}> = ({ children, activeTab, setActiveTab }) => {
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-e border-dark/5 p-6 z-20">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 green-gradient rounded-full flex items-center justify-center shadow-xl mb-4 border-4 border-white">
            <MosqueIcon size={40} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-primary text-center px-2">
            {t('app_title')}
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label={t('dashboard')} 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={MosqueIcon} 
            label={t('mosques')} 
            active={activeTab === 'mosques'} 
            onClick={() => setActiveTab('mosques')} 
          />
          <SidebarItem 
            icon={Settings} 
            label={t('settings')} 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="pt-6 border-t border-dark/5 space-y-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-dark/70 hover:bg-accent/10 hover:text-accent transition-all"
          >
            <Globe size={20} />
            <span className="font-medium">{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-dark/5 px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-dark" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-2xl font-bold text-dark hidden sm:block">
              {t(activeTab)}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-dark/60 hover:text-primary relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 ps-4 border-s border-dark/10">
              <div className="hidden sm:block text-end">
                <p className="text-sm font-bold text-dark">{user?.username}</p>
                <p className="text-xs text-dark/50 italic">المدير العام</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-dark/20 backdrop-blur-sm z-50 lg:hidden">
          <div className={cn(
            "fixed inset-y-0 w-72 bg-white p-6 shadow-2xl transition-transform duration-300",
            i18n.language === 'ar' ? "right-0" : "left-0"
          )}>
            <div className="flex justify-end mb-6">
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={24} className="text-dark/50" />
              </button>
            </div>
            
            <nav className="space-y-4">
              <SidebarItem 
                icon={LayoutDashboard} 
                label={t('dashboard')} 
                active={activeTab === 'dashboard'} 
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
              />
              <SidebarItem 
                icon={MosqueIcon} 
                label={t('mosques')} 
                active={activeTab === 'mosques'} 
                onClick={() => { setActiveTab('mosques'); setIsMobileMenuOpen(false); }} 
              />
              <SidebarItem 
                icon={Settings} 
                label={t('settings')} 
                active={activeTab === 'settings'} 
                onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} 
              />
              <div className="pt-6 border-t border-dark/5 space-y-4">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-dark/70 hover:bg-accent/10 hover:text-accent transition-all"
                >
                  <Globe size={20} />
                  <span className="font-medium">{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut size={20} />
                  <span className="font-medium">{t('logout')}</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
