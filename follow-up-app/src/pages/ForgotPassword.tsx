import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendEmailNotification } from '../lib/email';
import { MOCK_USERS } from '../mocks/users';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Check if user exists in app_users (Supabase)
            const { data: dbUser } = await supabase
                .from('app_users')
                .select('name, email, password')
                .eq('email', email)
                .single();

            let targetUser = dbUser;

            // 2. Fallback to MOCK_USERS if not found in DB
            if (!targetUser) {
                const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (mockUser) {
                    targetUser = {
                        name: mockUser.name,
                        email: mockUser.email,
                        password: mockUser.password
                    };
                }
            }

            if (!targetUser) {
                throw new Error('البريد الإلكتروني المدخل غير مسجل لدينا.');
            }

            // 3. Send the password recovery email
            const result = await sendEmailNotification('PASSWORD_RECOVERY', {
                email: targetUser.email,
                name: targetUser.name,
                password: targetUser.password
            });

            if (!result.success) {
                throw new Error(result.error || 'فشل إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى لاحقاً.');
            }

            setIsSuccess(true);
        } catch (err: any) {
            console.error('Password Recovery Error:', err);
            setError(err.message || 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#064E3B] flex items-center justify-center p-6 font-cairo">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-4">تم الإرسال!</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        لقد قمنا بإرسال بيانات الدخول الخاصة بك إلى البريد الإلكتروني: <br />
                        <span className="font-bold text-slate-700">{email}</span>
                    </p>
                    <Link 
                        to="/login"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
                    >
                        <span>العودة لتسجيل الدخول</span>
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-cairo relative overflow-hidden" dir="rtl">
            {/* Decorative background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[120px] opacity-60"></div>
                <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-teal-50 rounded-full blur-[100px] opacity-40"></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <div className="max-w-md w-full">
                    {/* Brand */}
                    <div className="flex flex-col items-center mb-10">
                        <img src="/logo.png" alt="Logo" className="h-20 w-auto mb-6" />
                        <h1 className="text-3xl font-black text-[#0D9488] text-center">استعادة كلمة المرور</h1>
                        <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">Islamic Affairs Platform</p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-900/5 border border-slate-100">
                        <div className="flex items-center gap-3 mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700">
                            <KeyRound className="w-5 h-5 shrink-0" />
                            <p className="text-xs font-bold leading-relaxed">أدخل بريدك الإلكتروني وسنقوم بإرسال كلمة المرور الخاصة بك فوراً.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5" />
                                <p className="text-xs font-bold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-600 mr-1">البريد الإلكتروني</label>
                                <div className="relative group">
                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <input 
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                                        placeholder="example@mail.com"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <span>إرسال كلمة المرور</span>
                                        <ArrowRight className="w-5 h-5 rotate-180" />
                                    </>
                                )}
                            </button>

                            <Link 
                                to="/login"
                                className="w-full py-4 flex items-center justify-center gap-2 text-slate-400 font-bold text-sm hover:text-emerald-600 transition-all"
                            >
                                <span>العودة لتسجيل الدخول</span>
                            </Link>
                        </form>
                    </div>
                    
                    <p className="mt-10 text-center text-[10px] text-slate-300 font-black uppercase tracking-widest">
                        جميع الحقوق محفوظة © دائرة الشؤون الإسلامية 2026
                    </p>
                </div>
            </div>
        </div>
    );
};
