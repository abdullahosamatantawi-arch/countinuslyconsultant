import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/AuthContext';
import { Landmark, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        toast.success(i18n.language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
      } else {
        toast.error(t('error_login'));
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 islamic-pattern overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden">
          {/* Top decoration */}
          <div className="absolute top-0 left-0 right-0 h-2 green-gradient"></div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 green-gradient rounded-3xl flex items-center justify-center shadow-lg mb-4 rotate-3 border-4 border-white">
              <Landmark size={40} className="text-white -rotate-3" />
            </div>
            <h1 className="text-2xl font-black text-primary text-center">
              {t('app_title')}
            </h1>
            <p className="text-dark/50 text-sm mt-2">نظام إدارة ومتابعة بناء المساجد</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-dark/70 ms-1" htmlFor="username">
                {t('username')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 text-dark/30 group-focus-within:text-primary transition-colors">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full ps-11 pe-4 py-3.5 bg-cream/50 border border-dark/5 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-dark/20"
                  placeholder={i18n.language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-dark/70 ms-1" htmlFor="password">
                {t('password')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 text-dark/30 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full ps-11 pe-12 py-3.5 bg-cream/50 border border-dark/5 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-dark/20"
                  placeholder={i18n.language === 'ar' ? '••••••••' : '••••••••'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-4 text-dark/30 hover:text-dark/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 green-gradient text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                t('login')
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between text-xs text-dark/40 font-medium">
            <p>© 2026 دائرة الشؤون الإسلامية</p>
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
                className="hover:text-primary transition-colors font-bold"
              >
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
