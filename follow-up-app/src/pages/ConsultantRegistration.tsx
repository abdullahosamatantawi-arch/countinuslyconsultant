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
  X,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { sendConsultantApplication } from '../lib/webhook';

const steps = [
  { id: 1, title: 'بيانات الشركة', icon: Building2 },
  { id: 2, title: 'معلومات التواصل', icon: User },
  { id: 3, title: 'التخصص والخبرة', icon: Briefcase },
  { id: 4, title: 'المراجعة', icon: ShieldCheck },
];

export const ConsultantRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    license_number: '',
    contact_person: '',
    email: '',
    phone: '',
    specialization: '',
    experience_years: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      nextStep();
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save to Supabase
      const { error } = await supabase
        .from('consultant_applications')
        .insert([{
          ...formData,
          experience_years: parseInt(formData.experience_years) || 0
        }]);

      if (error) throw error;

      // 2. Send to n8n Webhook
      await sendConsultantApplication({
        ...formData,
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
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-slate-800">بيانات المكتب الهندسي</h2>
                      <p className="text-slate-400 text-sm">أدخل البيانات الرسمية للمكتب كما هي مسجلة في التراخيص</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-600">اسم المكتب / الشركة <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                            required name="company_name" value={formData.company_name} onChange={handleInputChange}
                            className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                            placeholder="اسم الشركة الكامل"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-600">رقم الرخصة التجارية <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <FileText className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                            required name="license_number" value={formData.license_number} onChange={handleInputChange}
                            className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                            placeholder="رقم الرخصة الموحد"
                          />
                        </div>
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
                            className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                            placeholder="الاسم الثلاثي"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-black text-slate-600">البريد الإلكتروني <span className="text-red-500">*</span></label>
                          <div className="relative group">
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                              required type="email" name="email" value={formData.email} onChange={handleInputChange}
                              className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                              placeholder="example@mail.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-black text-slate-600">رقم الهاتف <span className="text-red-500">*</span></label>
                          <div className="relative group">
                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                              required type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                              className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-left"
                              placeholder="05x xxx xxxx"
                            />
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
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold cursor-pointer"
                        >
                          <option value="">-- اختر التخصص --</option>
                          <option value="architectural">معماري وانشائي</option>
                          <option value="interiors">خدمات كهروميكانيكية</option>
                          <option value="civil">مقاولات عامة</option>
                          <option value="landscaping">تنسيق حدائق</option>
                          <option value="consultancy">اشراف وبناء</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-600">سنوات الخبرة في المجال <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <Award className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                            required type="number" name="experience_years" value={formData.experience_years} onChange={handleInputChange}
                            className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                            placeholder="مثال: 10"
                          />
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
