import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home, Mail } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Global Error Boundary to catch UI crashes and show a premium fallback page.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="max-w-md w-full">
            {/* Background Pattern */}
            <div className="fixed inset-0 plus-pattern opacity-40 pointer-events-none" />
            
            <div className="relative glass-card rounded-3xl overflow-hidden border-brand-gold/20 shadow-2xl">
              {/* Header Gradient */}
              <div className="emerald-gradient h-32 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 islamic-pattern opacity-10" />
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="p-8 text-center space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 font-serif mb-2">عفواً، حدث خطأ تقني</h1>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    نعتذر عن هذا الخلل. لقد واجه النظام مشكلة غير متوقعة أثناء معالجة طلبك.
                  </p>
                </div>

                {import.meta.env.DEV && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-right overflow-auto max-h-32">
                    <p className="text-[10px] font-mono text-red-600 leading-tight">
                      {this.state.error?.toString()}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={this.handleReset}
                    className="w-full emerald-gradient text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-brand-emerald/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span>إعادة المحاولة الآن</span>
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = '/'}
                      className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Home className="w-4 h-4" />
                      <span>الرئيسية</span>
                    </button>
                    <a
                      href="mailto:support@example.com"
                      className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>الدعم الفني</span>
                    </a>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 italic text-[10px] text-slate-400">
                  مركز الأنظمة الهندسية - نظام متابعة الاعتمادات
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
