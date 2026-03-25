import React, { useState } from 'react';
import { Eye, EyeOff, CreditCard, Droplet, HelpCircle, Phone, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const [role, setRole] = useState<'manager' | 'consultant' | 'engineer'>('consultant');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const loginEmail = role === 'manager' ? 'admin@mosque.gov.ae' : email;
        const result = await login(loginEmail, password, role);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'خطأ في تسجيل الدخول');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 md:px-20 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain" />
                    <div className="hidden border-r border-gray-200 h-8 mx-2 md:block"></div>
                    <div className="hidden md:block">
                        <h1 className="text-[#0D9488] font-black text-xl leading-tight">دائرة الشؤون الإسلامية</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">بوابة الخدمات الرقمية</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
                        <span className="text-gray-600 text-sm font-bold">English (United States)</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                        <img src="https://ui-avatars.com/api/?name=User&background=0d9488&color=fff" alt="User" className="w-8 h-8 rounded-full" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none islamic-pattern"></div>
                
                <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-[2rem] shadow-2xl shadow-teal-900/5 border border-gray-100 overflow-hidden relative z-10">
                    
                    {/* Left Section - Login Form */}
                    <div className="flex-[1.2] p-8 md:p-12 border-l border-gray-50">
                        <div className="max-w-sm mx-auto space-y-8">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">تسجيل الدخول لحسابك</h2>
                                <p className="text-slate-400 text-sm mt-2 font-bold tracking-wide">أدخل بياناتك للوصول إلى المنصة</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-600 after:content-['*'] after:text-red-500 after:mr-1">نوع المستخدم</label>
                                        <div className="relative group">
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value as any)}
                                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all bg-white font-bold text-slate-700 cursor-pointer appearance-none shadow-sm"
                                            >
                                                <option value="consultant">استشاري (Consultant)</option>
                                                <option value="engineer">مهندس (Engineer)</option>
                                                <option value="manager">مدير النظام (Admin)</option>
                                            </select>
                                            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                                        </div>
                                    </div>

                                    {(role === 'consultant' || role === 'engineer') && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-black text-slate-600">اسم المستخدم</label>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    value={email}
                                                    required={role === 'consultant' || role === 'engineer'}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                    placeholder="أدخل اسم المستخدم"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-600">كلمة المرور</label>
                                        <div className="relative group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                required
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-3.5 pl-12 rounded-xl border border-gray-200 focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs font-bold px-1">
                                        <a href="#" className="text-teal-600 hover:text-teal-700 hover:underline">نسيت كلمة المرور؟</a>
                                        <a href="#" className="text-teal-600 hover:text-teal-700 hover:underline">نسيت اسم المستخدم؟</a>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-[#0D9488] hover:bg-[#0B7A6F] text-white font-black text-lg rounded-xl shadow-lg shadow-teal-500/10 transition-all transform active:scale-[0.98] mt-4"
                                >
                                    دخول النظام
                                </button>

                                <div className="text-center text-sm font-bold text-slate-500 mt-8">
                                    ليس لديك حساب؟ <a href="#" className="text-teal-600 hover:text-teal-700 border-b border-teal-600/30">سجل الآن</a>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Section - Quick Services */}
                    <div className="flex-1 bg-[#F9FAFB] p-8 md:p-12 flex flex-col justify-between border-t md:border-t-0 md:border-r border-gray-100">
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-slate-800 font-black text-lg mb-6 border-b border-teal-500/20 pb-4">خدمات سريعة</h3>
                                <ul className="space-y-6">
                                    <li className="flex items-center gap-4 text-slate-700 font-bold hover:text-teal-600 cursor-pointer transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center group-hover:border-teal-400 group-hover:shadow-teal-100/50 transition-all">
                                            <CreditCard className="w-5 h-5 text-teal-600" />
                                        </div>
                                        <span>دفع الرسوم</span>
                                    </li>
                                    <li className="flex items-center gap-4 text-slate-700 font-bold hover:text-teal-600 cursor-pointer transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center group-hover:border-teal-400 group-hover:shadow-teal-100/50 transition-all">
                                            <Droplet className="w-5 h-5 text-teal-600" />
                                        </div>
                                        <span>طلب خدمة مياه</span>
                                    </li>
                                    <li className="flex items-center gap-4 text-slate-700 font-bold hover:text-teal-600 cursor-pointer transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center group-hover:border-teal-400 group-hover:shadow-teal-100/50 transition-all">
                                            <HelpCircle className="w-5 h-5 text-teal-600" />
                                        </div>
                                        <span>الدعم الفني</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-[#EDFDFD] p-6 rounded-2xl border border-teal-100/50 space-y-3">
                                <p className="text-slate-600 text-xs font-bold">هل تحتاج للمساعدة؟</p>
                                <div className="flex items-center gap-3 text-[#0D9488] font-black text-2xl tracking-tight">
                                    <Phone className="w-6 h-6" />
                                    <span>600566665</span>
                                </div>
                                <p className="text-teal-800 text-[10px] font-black opacity-60">خدمة عملاء على مدار الساعة</p>
                            </div>
                        </div>

                        <div className="hidden lg:block pt-8">
                            <img src="/logo.png" alt="Overlay Logo" className="w-24 h-auto opacity-5 mx-auto" />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#F3F4F6] py-10 px-6 border-t border-gray-200">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-8 text-slate-500 font-bold text-sm">
                        <a href="#" className="hover:text-teal-600 transition-colors">الأسئلة الشائعة</a>
                        <a href="#" className="hover:text-teal-600 transition-colors">دليل الخدمات</a>
                        <a href="#" className="hover:text-teal-600 transition-colors">سياسة الخصوصية</a>
                    </div>
                    <div className="text-slate-400 text-xs font-bold">
                        جميع الحقوق محفوظة © دائرة الشؤون الإسلامية 2026
                    </div>
                </div>
            </footer>
        </div>
    );
};
