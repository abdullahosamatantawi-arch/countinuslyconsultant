import React, { useState } from 'react';
// Deployment Sync: 2026-04-09 13:10
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Award, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  UploadCloud,
  Sparkles,
  Loader2,
  ShieldCheck,
  X,
  AlertCircle as AlertIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { sendConsultantApplication } from '../lib/webhook';
import { extractLicenseData } from '../lib/aiService';
import { consultantApplicationSchema } from '../lib/validations';

const steps = [
  { id: 1, title: 'التحقق من المكتب', icon: ShieldCheck },
  { id: 2, title: 'معلومات التواصل', icon: User },
  { id: 3, title: 'التخصص والخبرة', icon: Briefcase },
  { id: 4, title: 'المراجعة', icon: ShieldCheck },
];

export const ConsultantRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    license_number: '',
    contact_person: '',
    email: '',
    phone: '',
    specialization: '',
    experience_years: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setExtractionError(null);

    try {
      // Direct call to our retry-enabled service
      const result = await extractLicenseData(file);
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          company_name: result.company_name,
          license_number: result.license_number
        }));
        setIsSuccess(true);
        // Professional pause before moving to next step
        setTimeout(() => {
          setIsSuccess(false);
          nextStep();
        }, 1800);
      } else {
        setExtractionError(result.message || 'نعتذر، لم نتمكن من قراءة البيانات بدقة بعد عدة محاولات. يرجى إدخالها يدوياً.');
      }
    } catch (err: any) {
      let errorMsg = 'عذراً، محرك التحليل الذكي مشغول حالياً. يرجى المحاولة لاحقاً أو إدخال البيانات يدوياً.';
      
      if (err.message?.includes('404')) {
        errorMsg = 'لم يتم العثور على محرك التحليل (404). يرجى التأكد من تفعيل Workflow n8n وإعادة تشغيل التيرمينال (npm run dev) لتفعيل الإعدادات الجديدة.';
      }
      
      setExtractionError(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Reset errors

    // 1. Validate Form Data with Zod
    const result = consultantApplicationSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      
      // If the error is in a different step, we should ideally jump there, 
      // but for now, we'll just stop the submission if it's the final step.
      if (currentStep === 4) {
        alert('يرجى تصحيح الأخطاء في البيانات المدخلة');
        return;
      }
    }

    if (currentStep < 4) {
      nextStep();
      return;
    }

    // Only proceed if validation passed
    if (!result.success) return;

    setIsSubmitting(true);
    try {
      // 1. Save to Supabase
      const { error } = await supabase
        .from('consultant_applications')
        .insert([{
          ...result.data,
          submitted_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // 2. Send to n8n Webhook
      await sendConsultantApplication({
        ...result.data,
        submitted_at: new Date().toISOString()
      });

      setIsSuccess(true);
      // Wait 3 seconds then redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 5000);

    } catch (err) {
      console.error('Submission error:', err);
      alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#064E3B] flex items-center justify-center p-6 font-cairo">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 text-center shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600 animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">تم استلام طلبك!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            شكراً لاهتمامك بالعمل مع دائرة الشؤون الإسلامية. 
            سيتم مراجعة طلبك من قبل القسم المختص والتواصل معك قريباً.
          </p>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-progress-timer"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">جاري تحويلك لصفحة الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-cairo overflow-x-hidden" dir="rtl">
      {/* Decorative background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-teal-50 rounded-full blur-[100px] opacity-40"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 px-6 md:px-20 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
          <div className="hidden border-r border-gray-200 h-8 mx-2 md:block"></div>
          <div>
            <h1 className="text-[#0D9488] font-black text-lg leading-tight">طلب تسجيل استشاري جديد</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Islamic Affairs Department</p>
          </div>
        </div>
        <Link to="/login" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-6 relative z-10">
        <div className="max-w-3xl w-full space-y-8">
          
          {/* Progress Steps */}
          <div className="relative flex justify-between">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border-2",
                    currentStep >= step.id 
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-200" 
                      : "bg-white border-gray-200 text-gray-400"
                  )}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[11px] font-bold transition-all duration-300",
                  currentStep >= step.id ? "text-emerald-900" : "text-gray-400"
                )}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
              
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {currentStep === 1 && (
                  <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center max-w-lg mx-auto mb-8">
                      <h3 className="text-2xl font-black text-emerald-900 mb-3">التحقق من الهوية الهندسية</h3>
                      <p className="text-emerald-700/70 text-sm leading-relaxed">
                        يرجى رفع نسخة من الرخصة التجارية سارية المفعول للتحقق من بيانات المكتب والبدء في طلب التسجيل تلقائياً.
                      </p>
                    </div>

                    <div className="relative group max-w-2xl mx-auto">
                      <div className={cn(
                        "relative overflow-hidden rounded-[2.5rem] border-2 border-dashed transition-all duration-500",
                        isAnalyzing ? "border-emerald-500 bg-emerald-50/30" : "border-emerald-200 hover:border-emerald-400 bg-white shadow-xl shadow-emerald-900/5",
                        isSuccess ? "border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/10" : ""
                      )}>
                        {isAnalyzing ? (
                          <div className="py-20 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                            <div className="relative">
                              <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mb-4" />
                              <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-500 animate-pulse" />
                            </div>
                            <h4 className="text-emerald-900 font-black text-xl mb-2">جاري تحليل الرخصة ذكياً...</h4>
                            <p className="text-emerald-600/70 text-sm font-bold animate-pulse">يتم الآن استخراج بيانات المكتب والتحقق من صحتها</p>
                            
                            {/* Shimmer Scan Effect */}
                            <div className="absolute inset-0 pointer-events-none opacity-20">
                              <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-emerald-400 to-transparent -translate-y-full animate-shimmer" />
                            </div>
                          </div>
                        ) : isSuccess ? (
                          <div className="py-20 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
                            <div className="relative mb-6">
                              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 animate-bounce">
                                <ShieldCheck className="w-12 h-12 text-white" />
                              </div>
                              <CheckCircle2 className="absolute -bottom-1 -right-1 w-8 h-8 text-emerald-600 bg-white rounded-full" />
                            </div>
                            <h4 className="text-emerald-900 font-black text-2xl mb-2">تم التحقق بنجاح!</h4>
                            <p className="text-emerald-600 font-bold mb-1">{formData.company_name}</p>
                            <p className="text-emerald-500/80 text-xs text-arabic-nums">رخصة رقم: {formData.license_number}</p>
                            <div className="mt-6 flex items-center justify-center gap-2 text-emerald-600 text-sm font-bold">
                              <span>جاري نقلك للخطوة التالية</span>
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                            </div>
                          </div>
                        ) : (
                          <div className="py-16 px-8 text-center flex flex-col items-center group-hover:scale-[1.02] transition-transform duration-500">
                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-100 group-hover:rotate-6 transition-all duration-500">
                              <UploadCloud className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h4 className="text-emerald-900 font-black text-xl mb-3">رفع الرخصة الموحدة (PDF أو صورة)</h4>
                            <p className="text-emerald-700/60 text-sm mb-8 max-w-sm font-medium leading-relaxed">
                              سيقوم النظام باستخراج اسم المكتب ورقم الرخصة تلقائياً لبدء عملية التسجيل.
                            </p>
                            
                            <span className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 transition-all cursor-pointer group/btn">
                              <Sparkles className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                              ابدأ التحقق الآن
                            </span>
                          </div>
                        )}

                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleLicenseUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer z-20"
                          disabled={isAnalyzing || isSuccess}
                        />
                        
                        {extractionError && (
                          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 text-amber-700 bg-amber-50/90 backdrop-blur px-5 py-4 rounded-2xl text-[13px] font-bold border border-amber-100 shadow-lg animate-in slide-in-from-bottom-2">
                            <AlertIcon className="w-5 h-5 text-amber-500 shrink-0" />
                            <span className="leading-relaxed flex-1">{extractionError}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExtractionError(null);
                              }}
                              className="text-amber-900/40 hover:text-amber-900 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Info */}
                    <div className="flex justify-center items-center gap-8 text-emerald-400">
                      <div className="flex items-center gap-2 opacity-60">
                        <Building2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">معالجة فورية</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-60">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">تحقق آمن</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-slate-800">معلومات المدير / الشخص المسؤول</h2>
                      <p className="text-slate-400 text-sm">سنستخدم هذه البيانات للتواصل معك بخصوص حالة الطلب</p>
                    </div>
                    <div className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-600">اسم الشخص المسؤول <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                            required name="contact_person" value={formData.contact_person} onChange={handleInputChange}
                            className={cn(
                              "w-full pr-12 pl-4 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold",
                              errors.contact_person ? "border-red-300 bg-red-50/10" : "border-slate-100"
                            )}
                            placeholder="الاسم الثلاثي"
                          />
                          {errors.contact_person && <p className="text-[10px] text-red-500 font-bold mt-1.5 mr-1 animate-in fade-in slide-in-from-right-1">{errors.contact_person}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-black text-slate-600">البريد الإلكتروني <span className="text-red-500">*</span></label>
                          <div className="relative group">
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                              required type="email" name="email" value={formData.email} onChange={handleInputChange}
                              className={cn(
                                "w-full pr-12 pl-4 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold",
                                errors.email ? "border-red-300 bg-red-50/10" : "border-slate-100"
                              )}
                              placeholder="example@mail.com"
                            />
                            {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1.5 mr-1 animate-in fade-in slide-in-from-right-1">{errors.email}</p>}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-slate-600">رقم الهاتف <span className="text-red-500">*</span></label>
                          <div className="relative group">
                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                              required type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                              className={cn(
                                "w-full pr-12 pl-4 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-left",
                                errors.phone ? "border-red-300 bg-red-50/10" : "border-slate-100"
                              )}
                              placeholder="05x xxx xxxx"
                            />
                            {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1.5 mr-1 animate-in fade-in slide-in-from-right-1">{errors.phone}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-slate-800">التخصص والخبرات السابقة</h2>
                      <p className="text-slate-400 text-sm">أخبرنا المزيد عن أعمالكم ومجال تخصصكم الرئيسي</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-600">مجال التخصص <span className="text-red-500">*</span></label>
                        <select 
                          required name="specialization" value={formData.specialization} onChange={handleInputChange}
                          className={cn(
                            "w-full px-4 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold cursor-pointer",
                            errors.specialization ? "border-red-300 bg-red-50/10" : "border-slate-100"
                          )}
                        >
                          <option value="">-- اختر التخصص --</option>
                          <option value="architectural">معماري وانشائي</option>
                          <option value="interiors">خدمات كهروميكانيكية</option>
                          <option value="civil">مقاولات عامة</option>
                          <option value="landscaping">تنسيق حدائق</option>
                          <option value="consultancy">اشراف وبناء</option>
                        </select>
                        {errors.specialization && <p className="text-[10px] text-red-500 font-bold mt-1.5 mr-1 animate-in fade-in slide-in-from-right-1">{errors.specialization}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-600">سنوات الخبرة في المجال <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <Award className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                            required type="number" name="experience_years" value={formData.experience_years} onChange={handleInputChange}
                            className={cn(
                              "w-full pr-12 pl-4 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold",
                              errors.experience_years ? "border-red-300 bg-red-50/10" : "border-slate-100"
                            )}
                            placeholder="مثال: 10"
                          />
                          {errors.experience_years && <p className="text-[10px] text-red-500 font-bold mt-1.5 mr-1 animate-in fade-in slide-in-from-right-1">{errors.experience_years}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-slate-800">مراجعة الطلب النهائي</h2>
                      <p className="text-slate-400 text-sm">يرجى التأكد من صحة كافة البيانات المدخلة قبل الإرسال</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {[
                        { label: 'الشركة', value: formData.company_name },
                        { label: 'الرخصة', value: formData.license_number },
                        { label: 'المسؤول', value: formData.contact_person },
                        { label: 'الإيميل', value: formData.email },
                        { label: 'الهاتف', value: formData.phone },
                        { label: 'التخصص', value: formData.specialization },
                      ].map((item, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                          <p className="font-bold text-slate-700 mt-1 truncate">{item.value || '---'}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
                      <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                      <p className="text-xs text-emerald-800 font-bold leading-relaxed">
                        بمجرد النقر على "إرسال البيانات"، فإنك تقر بصحة كافة المعلومات المقدمة لدائرة الشؤون الإسلامية، وسيتم مراجعتها من قبل القسم الفني والهندسي.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{currentStep === 4 ? 'إرسال طلب الانضمام' : 'الخطوة التالية'}</span>
                      <ChevronLeft className="w-5 h-5 translate-y-[1px]" />
                    </>
                  )}
                </button>
                
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronRight className="w-5 h-5" />
                    <span>السابق</span>
                  </button>
                )}
              </div>

            </form>
          </div>

          <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
            جميع الحقوق محفوظة © دائرة الشؤون الإسلامية 2026
          </p>
        </div>
      </main>
    </div>
  );
};
