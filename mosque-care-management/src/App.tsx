import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster, toast } from 'sonner';
import { useAuth } from './store/AuthContext';
import { useMosques } from './hooks/useMosques';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { MosqueCard } from './components/mosque/MosqueCard';
import { MosqueTable } from './components/mosque/MosqueTable';
import { MosqueForm } from './components/mosque/MosqueForm';
import { SettingsPage } from './components/settings/SettingsPage';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  Table as TableIcon,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Landmark
} from 'lucide-react';
import { cn } from './lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const App: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useTranslation();
  const { 
    mosques, 
    isLoading: isDataLoading, 
    lastSync, 
    refreshData, 
    addMosque, 
    updateMosque, 
    deleteMosque,
    config,
    updateConfig
  } = useMosques();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMosque, setEditingMosque] = useState<any>(null);

  // Filter and Sort Logic
  const filteredMosques = useMemo(() => {
    return mosques.filter(m => {
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = (
        (m.plotNumber || '').toLowerCase().includes(searchStr) ||
        (m.area || '').toLowerCase().includes(searchStr) ||
        (m.contractor || '').toLowerCase().includes(searchStr) ||
        (m.responsibleEngineer || '').toLowerCase().includes(searchStr)
      );
      const matchesRegion = selectedRegion === 'all' || m.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [mosques, searchQuery, selectedRegion]);

  const regions = useMemo(() => {
    if (!mosques.length) return ['all'];
    const r = new Set(mosques.map(m => m.region || 'غير محدد'));
    return ['all', ...Array.from(r)];
  }, [mosques]);

  // Group filtered mosques by region for display
  const groupedMosques = useMemo(() => {
    const groups = new Map<string, typeof filteredMosques>();
    filteredMosques.forEach(m => {
      const reg = m.region || 'غير محدد';
      if (!groups.has(reg)) groups.set(reg, []);
      groups.get(reg)!.push(m);
    });
    return groups;
  }, [filteredMosques]);

  // Export Logic
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredMosques);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mosques");
    XLSX.writeFile(wb, "mosques_report.xlsx");
    toast.success('تم تصدير ملف Excel بنجاح');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
    doc.setFont('Cairo');
    
    doc.text(t('app_title'), 14, 15);
    
    const tableData = filteredMosques.map(m => [
      m.plotNumber,
      m.area,
      m.responsibleEngineer,
      m.contractor,
      `${m.completionPercentage}%`,
      m.expectedOpeningDate
    ]);

    autoTable(doc, {
      head: [[t('plot_number'), t('area'), t('responsible_engineer'), t('contractor'), t('completion_percentage'), t('expected_opening')]],
      body: tableData,
      startY: 25,
      styles: { font: 'Cairo', halign: 'right' },
      headStyles: { fillColor: [27, 94, 32] },
    });

    doc.save('mosques_report.pdf');
    toast.success('تم تصدير ملف PDF بنجاح');
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-cream">
        <RefreshCw className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <LoginPage />
      </>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Toaster position="top-center" richColors />
      
      {activeTab === 'dashboard' && <Dashboard mosques={mosques} />}
      
      {activeTab === 'mosques' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Top Bar: Search + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-dark/5 shadow-sm">
            <div className="relative flex-1 max-w-md group">
              <div className="absolute inset-y-0 start-0 flex items-center ps-4 text-dark/30 group-focus-within:text-primary transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم القطعة أو المنطقة أو المقاول..."
                className="w-full ps-11 pe-4 py-3 bg-cream/50 border border-dark/5 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-cream p-1 rounded-2xl border border-dark/5">
                <button onClick={() => setViewType('grid')} className={cn("p-2.5 rounded-xl transition-all", viewType === 'grid' ? "bg-white text-primary shadow-sm" : "text-dark/40")}>
                  <LayoutGrid size={18} />
                </button>
                <button onClick={() => setViewType('table')} className={cn("p-2.5 rounded-xl transition-all", viewType === 'table' ? "bg-white text-primary shadow-sm" : "text-dark/40")}>
                  <TableIcon size={18} />
                </button>
              </div>
              <button onClick={exportToExcel} className="p-2.5 bg-white text-dark/60 hover:text-green-600 hover:bg-green-50 border border-dark/5 rounded-2xl transition-all" title="تصدير Excel">
                <FileSpreadsheet size={18} />
              </button>
              <button onClick={exportToPDF} className="p-2.5 bg-white text-dark/60 hover:text-red-500 hover:bg-red-50 border border-dark/5 rounded-2xl transition-all" title="تصدير PDF">
                <FileText size={18} />
              </button>
              <button onClick={refreshData} disabled={isDataLoading} className="p-2.5 bg-white text-dark/60 hover:text-primary hover:bg-primary/5 border border-dark/5 rounded-2xl transition-all" title="تحديث">
                <RefreshCw size={18} className={cn(isDataLoading && "animate-spin text-primary")} />
              </button>
              <button
                onClick={() => { setEditingMosque(null); setIsFormOpen(true); }}
                className="px-5 py-2.5 green-gradient text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                إضافة مسجد
              </button>
            </div>
          </div>

          {/* Region Tab Buttons */}
          {regions.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {regions.map(r => {
                const count = r === 'all' ? mosques.length : (groupedMosques.get(r)?.length ?? 0);
                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRegion(r)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border",
                      selectedRegion === r
                        ? "green-gradient text-white border-transparent shadow-lg shadow-primary/20"
                        : "bg-white text-dark/60 border-dark/5 hover:border-primary/20 hover:text-primary"
                    )}
                  >
                    <Landmark size={14} />
                    {r === 'all' ? 'جميع المناطق' : r}
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-black",
                      selectedRegion === r ? "bg-white/20" : "bg-dark/5"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading State */}
          {isDataLoading && (
            <div className="py-16 text-center">
              <RefreshCw className="animate-spin text-primary mx-auto mb-3" size={32} />
              <p className="text-dark/50 font-bold">جاري تحميل البيانات من Google Sheets...</p>
            </div>
          )}

          {/* Empty State */}
          {!isDataLoading && filteredMosques.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-dark/10">
              <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                <Landmark size={36} className="text-dark/20" />
              </div>
              <h3 className="text-xl font-black text-dark/60">لا توجد مساجد</h3>
              <p className="text-dark/40 mt-2 text-sm">
                {mosques.length === 0
                  ? 'تأكد من ربط Google Sheets في صفحة الإعدادات'
                  : 'لا توجد نتائج لكلمة البحث الحالية'}
              </p>
            </div>
          )}

          {/* Grid View — grouped by region */}
          {!isDataLoading && filteredMosques.length > 0 && viewType === 'grid' && (
            <div className="space-y-10">
              {Array.from(groupedMosques.entries()).map(([region, regionMosques]) => (
                <div key={region}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1.5 h-7 green-gradient rounded-full" />
                    <h2 className="text-xl font-black text-dark">{region}</h2>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full">{regionMosques.length} مسجد</span>
                    <div className="flex-1 h-px bg-dark/5" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {regionMosques.map(mosque => (
                      <MosqueCard
                        key={mosque.id}
                        mosque={mosque}
                        onEdit={(m) => { setEditingMosque(m); setIsFormOpen(true); }}
                        onView={(m) => { setEditingMosque(m); setIsFormOpen(true); }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View — grouped by region */}
          {!isDataLoading && filteredMosques.length > 0 && viewType === 'table' && (
            <div className="space-y-8">
              {Array.from(groupedMosques.entries()).map(([region, regionMosques]) => (
                <div key={region}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-6 green-gradient rounded-full" />
                    <h2 className="text-lg font-black text-dark">{region}</h2>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full">{regionMosques.length} مسجد</span>
                    <div className="flex-1 h-px bg-dark/5" />
                  </div>
                  <MosqueTable
                    mosques={regionMosques}
                    onEdit={(m) => { setEditingMosque(m); setIsFormOpen(true); }}
                    onDelete={deleteMosque}
                    onView={(m) => { setEditingMosque(m); setIsFormOpen(true); }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Sync bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white/60 rounded-2xl border border-dark/5 text-[10px] font-bold text-dark/40">
            <span className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full", isDataLoading ? "bg-blue-400 animate-pulse" : "bg-green-500")} />
              {isDataLoading ? 'جاري المزامنة...' : `آخر مزامنة: ${lastSync ? lastSync.toLocaleTimeString('ar') : '---'}`}
            </span>
            <span className="font-black">{mosques.length} مسجد إجمالاً</span>
          </div>
        </div>
      )}


      {activeTab === 'settings' && <SettingsPage config={config} updateConfig={updateConfig} />}


      {/* Form Modal */}
      <MosqueForm 
        isOpen={isFormOpen}
        mosque={editingMosque}
        onCancel={() => setIsFormOpen(false)}
        onSave={async (data: any) => {
          const mosqueData = {
            ...data,
            totalCapacity: (Number(data.menCapacity) || 0) + (Number(data.womenCapacity) || 0)
          };
          if (editingMosque) {
            await updateMosque({ ...editingMosque, ...mosqueData });
          } else {
            await addMosque(mosqueData);
          }
          setIsFormOpen(false);
        }}
      />
    </Layout>
  );
};

export default App;
