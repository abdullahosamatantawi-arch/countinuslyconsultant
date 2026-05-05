import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppConfig } from '../../types';
import { 
  Database, 
  Key, 
  RefreshCw, 
  Save,
  Link2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { GoogleSheetsService } from '../../lib/GoogleSheetsService';

export const SettingsPage: React.FC<{ 
  config: AppConfig | null, 
  updateConfig: (config: AppConfig) => void 
}> = ({ config, updateConfig }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<AppConfig>({
    spreadsheetId: '1dhyw_gFmT0_0d_wzNnCBFDgchUvnlJoSd3U2Ni42CWg',
    sheetName: 'Sheet1',
    apiKey: '',
    syncInterval: 5,
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig(formData);
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testCount, setTestCount] = useState<number | null>(null);

  const testConnection = async () => {
    setIsTesting(true);
    setTestStatus('idle');
    setTestCount(null);
    try {
      const service = new GoogleSheetsService(formData);
      const result = await service.testConnection();
      setTestStatus('success');
      setTestCount(result.count);
      toast.success(`تم الاتصال بـ Google Sheets بنجاح — تم العثور على ${result.count} مسجداً`);
    } catch (error: any) {
      setTestStatus('error');
      toast.error(error.message || 'فشل الاتصال: تحقق من معرف جدول البيانات وكلمة مفتاح API');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Google Sheets Integration Section */}
      <div className="bg-white rounded-3xl border border-dark/5 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-dark/5 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-dark">إعدادات Google Sheets</h3>
              <p className="text-dark/40 text-sm font-medium">إعدادات الربط مع قاعدة البيانات الحية</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-dark/5 shadow-sm">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full animate-pulse",
              testStatus === 'success' ? "bg-green-500" : testStatus === 'error' ? "bg-red-500" : "bg-yellow-400"
            )}></div>
            <span className="text-xs font-black uppercase text-dark/60">
              {testStatus === 'success' ? `متصل (${testCount} مسجد)` : testStatus === 'error' ? 'خطأ في الاتصال' : 'في انتظار الاختبار'}
            </span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <Link2 size={14} className="text-primary" />
                معرف جدول البيانات (Spreadsheet ID)
              </label>
              <input 
                type="text"
                value={formData.spreadsheetId}
                onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
                className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-mono text-xs"
                placeholder="1aBcD...XyZ"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <Database size={14} className="text-primary" />
                اسم الورقة (Sheet Name)
              </label>
              <input 
                type="text"
                value={formData.sheetName}
                onChange={(e) => setFormData({ ...formData, sheetName: e.target.value })}
                className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                placeholder="Sheet1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-dark/70 flex items-center gap-2">
              <Key size={14} className="text-primary" />
              مفتاح Google Sheets API (API Key)
            </label>
            <input 
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-mono text-xs"
              placeholder="AIzaSy..."
            />
            <p className="text-xs text-dark/40 mt-1">
              يمكنك إنشاء مفتاح API من{' '}
              <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                Google Cloud Console
              </a>
              {' '}مع تفعيل Google Sheets API. أو اجعل الجدول عاماً (Anyone with the link can view).
            </p>
          </div>

          {/* Status messages */}
          {testStatus === 'success' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100">
              <CheckCircle2 size={20} />
              <span className="font-bold text-sm">تم الاتصال بنجاح! تم العثور على {testCount} مسجداً في الجدول.</span>
            </div>
          )}
          {testStatus === 'error' && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
              <XCircle size={20} />
              <span className="font-bold text-sm">فشل الاتصال. تأكد من أن معرف الجدول صحيح وأن الجدول متاح للعموم أو أن مفتاح API صحيح.</span>
            </div>
          )}

          <div className="pt-4 flex flex-wrap gap-4">
            <button 
              onClick={testConnection}
              disabled={isTesting}
              className="px-8 py-3 bg-white hover:bg-dark/5 text-dark font-black rounded-2xl border border-dark/10 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isTesting ? <RefreshCw className="animate-spin" size={20} /> : <Database size={20} />}
              اختبار الاتصال
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-3 green-gradient text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Save size={20} />
              {t('save')}
            </button>
          </div>
        </div>
      </div>

      {/* Sync Interval Section */}
      <div className="bg-white rounded-3xl border border-dark/5 shadow-sm p-8">
        <h3 className="text-xl font-black text-dark mb-6 flex items-center gap-4">
          <RefreshCw className="text-primary" />
          إعدادات المزامنة التلقائية
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex-1 space-y-4">
            <input 
              type="range"
              min="1"
              max="60"
              value={formData.syncInterval}
              onChange={(e) => setFormData({ ...formData, syncInterval: parseInt(e.target.value) })}
              className="w-full h-3 bg-cream rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-sm font-bold text-dark/40 uppercase">
              <span>دقيقة واحدة</span>
              <span className="text-primary text-xl font-black">{formData.syncInterval} دقيقة</span>
              <span>60 دقيقة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8">
        <h3 className="text-lg font-black text-amber-800 mb-4 flex items-center gap-2">
          📋 كيفية الربط مع Google Sheets
        </h3>
        <ol className="space-y-3 text-sm text-amber-700 font-medium list-decimal list-inside">
          <li>افتح جدول البيانات وانقر على <strong>Share</strong> ← <strong>Anyone with the link can view</strong></li>
          <li>انسخ معرف الجدول من الرابط (الجزء بين <code className="bg-amber-100 px-1 rounded">/d/</code> و <code className="bg-amber-100 px-1 rounded">/edit</code>)</li>
          <li>اختيارياً: أنشئ مفتاح API من Google Cloud Console لزيادة حد الطلبات</li>
          <li>اضغط <strong>اختبار الاتصال</strong> للتحقق، ثم <strong>حفظ</strong></li>
        </ol>
        <div className="mt-4 p-3 bg-amber-100 rounded-xl font-mono text-xs text-amber-800 break-all">
          معرف جدولك الحالي: <strong>1dhyw_gFmT0_0d_wzNnCBFDgchUvnlJoSd3U2Ni42CWg</strong>
        </div>
      </div>
    </div>
  );
};
