import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const [role, setRole] = useState<'manager' | 'consultant' | 'engineer'>('consultant');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Use default admin email if role is manager
        const loginEmail = role === 'manager' ? 'admin@mosque.gov.ae' : email;
        const result = await login(loginEmail, password, role);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'خطأ في تسجيل الدخول');
        }
    };

    return (

        <div className="min-h-screen flex flex-col md:flex-row bg-white">
            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-12 relative z-10 bg-white">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center relative">
                        <div className="w-28 h-28 mx-auto mb-8 p-6 glass-card rounded-3xl flex items-center justify-center border-brand-gold/20 shadow-brand-gold/10 relative z-10 transition-transform hover:scale-105 duration-500">
                            <img src="/logo.png" alt="شعار دائرة الشؤون الإسلامية" className="w-full h-full object-contain" />
                        </div>

                        <div className="space-y-1 mb-8">
                            <h2 className="text-4xl font-serif font-black text-brand-emerald mb-2 tracking-tight">دائرة الشؤون الاسلامية</h2>
                            <p className="text-brand-gold font-black text-lg font-serif">ادارة بناء ورعاية المساجد</p>
                        </div>

                        <div className="pt-6 border-t border-brand-gold/10 inline-block px-12">
                            <h1 className="text-xl font-bold text-slate-700 uppercase tracking-[0.2em]">نظام اعتماد المخططات</h1>
                            <p className="text-slate-400 text-[10px] font-black mt-2">مرحباً بك في المنصة الذكية لاعتماد المخططات الهندسية</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 flex items-center gap-2">
                                <span className="block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">نوع المستخدم</label>
                                <div className="relative">
                                    <select
                                        value={role}
                                        onChange={(e) => {
                                            setRole(e.target.value as any);
                                            setEmail('');
                                            setPassword('');
                                            setError('');
                                        }}
                                        className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-brand-emerald/5 focus:border-brand-gold outline-none transition-all bg-white font-bold text-slate-700 cursor-pointer appearance-none shadow-sm"
                                    >
                                        <option value="consultant">استشاري</option>
                                        <option value="engineer">مهندس</option>
                                        <option value="manager">مدير النظام</option>
                                    </select>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gold">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            {(role === 'consultant' || role === 'engineer') && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">اسم المستخدم / البريد</label>
                                    <div className="relative group">
                                        <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                        <input
                                            type="text"
                                            value={email}
                                            required={role === 'consultant' || role === 'engineer'}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pr-12 pl-4 py-3.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium"
                                            placeholder="أدخل المعرف الخاص بك"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">كلمة المرور</label>
                                <div className="relative group">
                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        required
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pr-12 pl-4 py-3.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 emerald-gradient hover:shadow-2xl hover:shadow-brand-emerald/30 text-white font-black text-lg rounded-2xl shadow-xl shadow-brand-emerald/20 transition-all transform active:scale-[0.98] border border-white/10"
                        >
                            دخول النظام
                        </button>

                        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 text-center leading-relaxed">
                                {role === 'manager' && 'الدخول مخصص لمديري النظام والإداريين فقط'}
                                {role === 'engineer' && 'الدخول مخصص للمهندسين لمراجعة المخططات'}
                                {role === 'consultant' && 'الدخول مخصص للمكاتب الاستشارية المعتمدة'}
                            </p>
                        </div>
                    </form>

                    <div className="text-center">
                        <p className="text-xs text-slate-400 font-medium">© 2026 دائرة الشؤون الإسلامية - الشارقة</p>
                    </div>
                </div>
            </div>

            {/* Left Side - Decorative Background */}
            <div 
                className="hidden md:block w-1/2 relative overflow-hidden bg-slate-50"
                style={{ 
                    backgroundImage: 'url(/login-bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="relative h-full flex flex-col items-center justify-between py-20 px-16 text-center z-10">
                    {/* Top spacing to allow the central calligraphy to shine */}
                    <div className="flex-1"></div>

                    <div className="max-w-md space-y-12 relative z-20">
                        <div className="space-y-6">
                            <p className="text-brand-gold text-3xl font-serif leading-relaxed drop-shadow-sm opacity-90 italic">
                                "مَنْ بَنَى مَسْجِدًا لِلَّهِ كَمَفْحَصِ قَطَاةٍ أَوْ أَصْغَرَ<br />
                                بَنَى اللَّهُ لَهُ بَيْتًا فِي الْجَنَّةِ"
                            </p>
                            <div className="h-0.5 w-24 bg-brand-gold/30 mx-auto rounded-full"></div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-brand-emerald text-sm font-black uppercase tracking-[0.3em]">المنصة الذكية لإعتماد المخططات الهندسيه</p>
                        </div>

                        {/* Stats Cards with better contrast */}
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-sm transition-transform hover:scale-105">
                                <div className="text-2xl font-black text-brand-emerald mb-1">24/7</div>
                                <div className="text-[10px] text-slate-500 font-bold">خدمات رقمية</div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-sm transition-transform hover:scale-105">
                                <div className="text-2xl font-black text-brand-emerald mb-1">100%</div>
                                <div className="text-[10px] text-slate-500 font-bold">تحول ذكي</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
