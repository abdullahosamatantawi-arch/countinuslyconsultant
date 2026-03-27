import React, { useState } from 'react';
import { Eye, EyeOff, HelpCircle, Phone, ChevronDown, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const translations = {
    ar: {
        deptName: "دائرة الشؤون الإسلامية",
        portalSub: "بوابة الخدمات الرقمية",
        langLabel: "English",
        signInTitle: "تسجيل الدخول لحسابك",
        signInSub: "أدخل بياناتك للوصول إلى المنصة",
        userType: "نوع المستخدم",
        username: "اسم المستخدم",
        password: "كلمة المرور",
        usernamePlaceholder: "أدخل اسم المستخدم",
        passwordPlaceholder: "••••••••",
        forgotPass: "نسيت كلمة المرور؟",
        forgotUser: "نسيت اسم المستخدم؟",
        loginButton: "دخول النظام",
        noAccount: "ليس لديك حساب؟",
        signUp: "سجل الآن",
        needHelp: "هل تحتاج للمساعدة؟",
        supportHours: "خدمة عملاء على مدار الساعة",
        faqs: "الأسئلة الشائعة",
        serviceGuide: "دليل الخدمات",
        privacyPolicy: "سياسة الخصوصية",
        copyright: "جميع الحقوق محفوظة © دائرة الشؤون الإسلامية 2026",
        roles: {
            consultant: "استشاري (Consultant)",
            engineer: "مهندس (Engineer)",
            manager: "مدير النظام (Admin)"
        }
    },
    en: {
        deptName: "Islamic Affairs Department",
        portalSub: "Digital Services Portal",
        langLabel: "العربية",
        signInTitle: "Sign in to your account",
        signInSub: "Enter your credentials to access the platform",
        userType: "User Type",
        username: "Username",
        password: "Password",
        usernamePlaceholder: "Enter your username",
        passwordPlaceholder: "••••••••",
        forgotPass: "Forgot Password?",
        forgotUser: "Forgot Username?",
        loginButton: "Sign In",
        noAccount: "Don't have an account?",
        signUp: "Sign Up",
        needHelp: "Need Assistance?",
        supportHours: "24/7 Customer Support",
        faqs: "FAQs",
        serviceGuide: "Service Guide",
        privacyPolicy: "Privacy Policy",
        copyright: "All Rights Reserved © Islamic Affairs 2026",
        roles: {
            consultant: "Consultant",
            engineer: "Engineer",
            manager: "Admin"
        }
    }
};

export const Login = () => {
    const [lang, setLang] = useState<'ar' | 'en'>('ar');
    const [role, setRole] = useState<'manager' | 'consultant' | 'engineer'>('consultant');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const t = translations[lang];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const loginEmail = role === 'manager' ? 'admin@mosque.gov.ae' : email;
        const result = await login(loginEmail, password, role);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || (lang === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login Failed'));
        }
    };

    const toggleLang = () => {
        setLang(lang === 'ar' ? 'en' : 'ar');
    };

    return (
        <div className={`min-h-screen flex flex-col bg-[#F9FAFB] font-sans`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 md:px-20 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain" />
                    <div className="hidden border-r border-gray-200 h-8 mx-2 md:block"></div>
                    <div className="hidden md:block">
                        <h1 className="text-[#0D9488] font-black text-xl leading-tight">{t.deptName}</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t.portalSub}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleLang}
                        className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 cursor-pointer transition-colors shadow-sm"
                    >
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 text-sm font-bold">{t.langLabel}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                        <img src="https://ui-avatars.com/api/?name=User&background=0d9488&color=fff" alt="User" className="w-8 h-8 rounded-full" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none islamic-pattern"></div>
                
                <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-[2rem] shadow-2xl shadow-teal-900/5 border border-gray-100 overflow-hidden relative z-10 min-h-[500px]">
                    
                    {/* Left Section - Login Form */}
                    <div className={`flex-[1.2] p-8 md:p-12 ${lang === 'ar' ? 'border-l' : 'border-r'} border-gray-50`}>
                        <div className="max-w-sm mx-auto space-y-8">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t.signInTitle}</h2>
                                <p className="text-slate-400 text-sm mt-2 font-bold tracking-wide">{t.signInSub}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-600 after:content-['*'] after:text-red-500 after:mx-1">{t.userType}</label>
                                        <div className="relative group">
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value as any)}
                                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all bg-white font-bold text-slate-700 cursor-pointer appearance-none shadow-sm"
                                            >
                                                <option value="consultant">{t.roles.consultant}</option>
                                                <option value="engineer">{t.roles.engineer}</option>
                                                <option value="manager">{t.roles.manager}</option>
                                            </select>
                                            <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-focus-within:rotate-180 transition-transform`} />
                                        </div>
                                    </div>

                                    {(role === 'consultant' || role === 'engineer') && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-black text-slate-600">{t.username}</label>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    value={email}
                                                    required={role === 'consultant' || role === 'engineer'}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all font-bold text-slate-700 shadow-sm placeholder:opacity-50"
                                                    placeholder={t.usernamePlaceholder}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-slate-600">{t.password}</label>
                                        <div className="relative group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                required
                                                onChange={(e) => setPassword(e.target.value)}
                                                className={`w-full px-4 py-3.5 ${lang === 'ar' ? 'pl-12' : 'pr-12'} rounded-xl border border-gray-200 focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all font-bold text-slate-700 shadow-sm placeholder:opacity-50`}
                                                placeholder={t.passwordPlaceholder}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors`}
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs font-bold px-1">
                                        <a href="#" className="text-teal-600 hover:text-teal-700 hover:underline">{t.forgotPass}</a>
                                        <a href="#" className="text-teal-600 hover:text-teal-700 hover:underline">{t.forgotUser}</a>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-[#0D9488] hover:bg-[#0B7A6F] text-white font-black text-lg rounded-xl shadow-lg shadow-teal-500/10 transition-all transform active:scale-[0.98] mt-4"
                                >
                                    {t.loginButton}
                                </button>

                                <div className="text-center text-sm font-bold text-slate-500 mt-8">
                                    {t.noAccount} <a href="#" className="text-teal-600 hover:text-teal-700 border-b border-teal-600/30">{t.signUp}</a>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Section - Assistance Box Only */}
                    <div className="flex-1 bg-[#F9FAFB] p-8 md:p-12 flex flex-col justify-center items-center">
                        <div className="w-full max-w-xs space-y-6">
                            <div className="bg-[#EDFDFD] p-8 rounded-[2rem] border border-teal-100/50 space-y-4 text-center shadow-sm">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-2 border border-teal-50">
                                    <Phone className="w-8 h-8 text-[#0D9488]" />
                                </div>
                                <p className="text-slate-600 text-sm font-bold">{t.needHelp}</p>
                                <div className="text-[#0D9488] font-black text-3xl tracking-tight">
                                    600566665
                                </div>
                                <p className="text-teal-800 text-xs font-black opacity-60 uppercase tracking-wider">{t.supportHours}</p>
                            </div>
                            
                            <div className="text-center space-y-4 pt-4">
                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                    <HelpCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{lang === 'ar' ? 'المركز الذكي' : 'SMART CENTER'}</span>
                                </div>
                                <img src="/logo.png" alt="Overlay Logo" className="w-20 h-auto opacity-[0.08] mx-auto grayscale" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#F3F4F6] py-10 px-6 border-t border-gray-200">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-8 text-slate-500 font-bold text-sm">
                        <a href="#" className="hover:text-teal-600 transition-colors">{t.faqs}</a>
                        <a href="#" className="hover:text-teal-600 transition-colors">{t.serviceGuide}</a>
                        <a href="#" className="hover:text-teal-600 transition-colors">{t.privacyPolicy}</a>
                    </div>
                    <div className="text-slate-400 text-xs font-bold">
                        {t.copyright}
                    </div>
                </div>
            </footer>
        </div>
    );
};
