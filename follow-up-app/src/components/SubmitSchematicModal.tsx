import React, { useState, useEffect } from 'react';
import { X, UploadCloud, File, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Project, StageType } from '../types';

interface SubmitSchematicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubmitSchematicModal: React.FC<SubmitSchematicModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [selectedDwg, setSelectedDwg] = useState<File | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isDraggingDwg, setIsDraggingDwg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedStageType, setSelectedStageType] = useState<StageType | ''>('');
  const [comments, setComments] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch projects for the dropdown
  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchProjects = async () => {
      let query = supabase.from('projects').select('id, name, project_number');
      // If consultant, only show their projects. If engineer/manager, show all active
      if (user.role === 'consultant') {
        query = query.eq('consultant_id', user.id);
      }
      const { data, error } = await query;
      if (!error && data) {
        setProjects(data as any[]);
      }
    };
    fetchProjects();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleDragOverPdf = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingPdf(true); };
  const handleDragLeavePdf = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingPdf(false); };
  const handleDropPdf = (e: React.DragEvent) => {
    e.preventDefault(); setIsDraggingPdf(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files[0].name.toLowerCase().endsWith('.pdf')) {
        setSelectedPdf(e.dataTransfer.files[0]);
      } else {
        setErrorMsg('يرجى اختيار ملف PDF صالح.');
      }
    }
  };
  const handleFileChangePdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setSelectedPdf(e.target.files[0]);
  };

  const handleDragOverDwg = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingDwg(true); };
  const handleDragLeaveDwg = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingDwg(false); };
  const handleDropDwg = (e: React.DragEvent) => {
    e.preventDefault(); setIsDraggingDwg(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const name = e.dataTransfer.files[0].name.toLowerCase();
      if (name.endsWith('.dwg') || name.endsWith('.dxf')) {
        setSelectedDwg(e.dataTransfer.files[0]);
      } else {
        setErrorMsg('يرجى اختيار ملف AutoCAD صالح (.dwg, .dxf).');
      }
    }
  };
  const handleFileChangeDwg = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setSelectedDwg(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if ((!selectedPdf && !selectedDwg) || !selectedProjectId || !selectedStageType || !user) {
      setErrorMsg('يرجى رفع ملف الـ PDF أو ملف الـ AutoCAD على الأقل.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      let pdfUrl: string | null = null;
      let dwgUrl: string | null = null;

      // 1. Upload PDF if exists
      if (selectedPdf) {
        const pdfExt = selectedPdf.name.split('.').pop();
        const pdfFileName = `${selectedProjectId}/${selectedStageType}_v1_${Date.now()}.${pdfExt}`;
        const { error: pdfUploadError } = await supabase.storage.from('schematics').upload(pdfFileName, selectedPdf);
        if (pdfUploadError) throw new Error("خطأ في رفع ملف الـ PDF.");
        pdfUrl = `${supabase.storage.from('schematics').getPublicUrl(pdfFileName).data.publicUrl}`;
      }

      // 1.1 Upload DWG if exists
      if (selectedDwg) {
        const dwgExt = selectedDwg.name.split('.').pop();
        const dwgFileName = `${selectedProjectId}/${selectedStageType}_dwg_v1_${Date.now()}.${dwgExt}`;
        const { error: dwgUploadError } = await supabase.storage.from('schematics').upload(dwgFileName, selectedDwg);
        if (dwgUploadError) throw new Error("خطأ في رفع ملف الـ AutoCAD.");
        dwgUrl = `${supabase.storage.from('schematics').getPublicUrl(dwgFileName).data.publicUrl}`;
      }

      // 2. Check if this ProjectStage already exists
      let stageId = null;
      let versionNumber = 1;

      const { data: existingStages, error: stageCheckError } = await supabase
        .from('project_stages')
        .select('id')
        .eq('project_id', selectedProjectId)
        .eq('stage_type', selectedStageType);

      if (stageCheckError) throw new Error("خطأ في التحقق من المرحلة المرجعية.");

      if (existingStages && existingStages.length > 0) {
        stageId = existingStages[0].id;
        // Get the latest version number
        const { data: latestSub } = await supabase
          .from('stage_submissions')
          .select('version_number')
          .eq('stage_id', stageId)
          .order('version_number', { ascending: false })
          .limit(1);
        if (latestSub && latestSub.length > 0) {
          versionNumber = latestSub[0].version_number + 1;
        }
        
        // Update stage status
        await supabase.from('project_stages').update({ 
          status: 'submitted',
          drawing_url: pdfUrl,
          dwg_url: dwgUrl
        }).eq('id', stageId);
      } else {
        // Mapping for Arabic names
        const stageNameMap: Record<string, string> = {
          architectural: 'المخطط المعماري',
          structural: 'المخطط الانشائي',
          sanitary: 'مخطط صحي',
          electrical: 'مخطط كهرباء',
          water: 'مخطط المياة',
          gas: 'مخطط الغاز',
          civil_defense: 'مخطط الدفاع المدني',
          telecom: 'مخطط اتصالات'
        };

        // Get current count for ordering
        const { count } = await supabase
          .from('project_stages')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', selectedProjectId);

        // Create new Stage
        const { data: newStage, error: createStageError } = await supabase
          .from('project_stages')
          .insert({
            project_id: selectedProjectId,
            stage_type: selectedStageType,
            name: stageNameMap[selectedStageType] || selectedStageType,
            status: 'submitted',
            stage_order: count || 0,
            drawing_url: pdfUrl,
            dwg_url: dwgUrl
          })
          .select()
          .single();
        if (createStageError) throw new Error("خطأ في تسجيل المرحلة المرجعية.");
        stageId = newStage.id;
      }

      // 3. Create StageSubmission record
      const { data: newSubmission, error: submitError } = await supabase
        .from('stage_submissions')
        .insert({
          stage_id: stageId,
          version_number: versionNumber,
          submitted_by: user.id,
          file_url: pdfUrl,
          dwg_url: dwgUrl,
          status: 'under_review'
        })
        .select()
        .single();
        
      if (submitError) throw new Error("خطأ في تسجيل بيانات المخطط في قاعدة البيانات.");

      // 4. (Optional) Insert initial comment if provided
      if (comments.trim() && newSubmission) {
        await supabase.from('comments').insert({
          submission_id: newSubmission.id,
          author_id: user.id,
          comment_text: comments.trim()
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedPdf(null);
        setSelectedDwg(null);
        setSelectedProjectId('');
        setSelectedStageType('');
        setComments('');
        onClose();
      }, 2500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "حدث خطأ غير متوقع أثناء المعالجة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-cairo">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 m-4 border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">تقديم مخطط جديد للاعتماد</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center mb-6 text-teal-600 animate-bounce shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">تم رفع المخطط بنجاح!</h3>
            <p className="text-slate-500 font-medium">تم إرسال المخطط للمراجعة الهندسية، سيتم إخطارك عند ورود أي ملاحظات.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 flex flex-col">
            
            {errorMsg && (
                <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold">
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">المشروع <span className="text-red-500">*</span></label>
                <select 
                  required 
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3.5 bg-white text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm appearance-none cursor-pointer">
                  <option value="">-- اختر المشروع --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700">نوع المخطط <span className="text-red-500">*</span></label>
                <select 
                  required 
                  value={selectedStageType}
                  onChange={e => setSelectedStageType(e.target.value as StageType)}
                  className="w-full border border-slate-200 rounded-xl p-3.5 bg-white text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm appearance-none cursor-pointer">
                  <option value="">-- اختر نوع المخطط --</option>
                  <option value="architectural">المخطط المعماري (Architectural)</option>
                  <option value="structural">المخطط الانشائي (Structural)</option>
                  <option value="sanitary">مخطط صحي (Sanitary)</option>
                  <option value="electrical">مخطط كهرباء (Electrical)</option>
                  <option value="water">مخطط المياة (Water)</option>
                  <option value="gas">مخطط الغاز (Gas)</option>
                  <option value="civil_defense">مخطط الدفاع المدني (Civil Defense)</option>
                  <option value="telecom">مخطط اتصالات (Telecom)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">ملاحظات للمراجعة الهندسية (اختياري)</label>
              <textarea 
                value={comments}
                onChange={e => setComments(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm min-h-[100px] resize-none"
                placeholder="أضف أي تفاصيل أو ملاحظات تفيد المهندس أثناء المراجعة..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PDF Dropzone */}
              <div 
                onDragOver={handleDragOverPdf}
                onDragLeave={handleDragLeavePdf}
                onDrop={handleDropPdf}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 relative group cursor-pointer",
                  isDraggingPdf ? "border-teal-400 bg-teal-50/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-teal-200",
                  selectedPdf ? "border-teal-400 bg-teal-50/30" : ""
                )}
              >
                <input type="file" id="pdf-upload" className="hidden" accept=".pdf" onChange={handleFileChangePdf} />
                
                {!selectedPdf ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                      <File className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-black mb-1">رفع المخطط (PDF)</p>
                      <p className="text-xs text-slate-500 font-medium mb-4">يجب إرفاق المخطط بصيغة PDF</p>
                    </div>
                    <label htmlFor="pdf-upload" className="cursor-pointer bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-red-600 transition-colors shadow-sm pointer-events-none">
                      استعراض (PDF)
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-800 font-black text-sm mb-1 block truncate max-w-[150px] mx-auto">{selectedPdf.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{(selectedPdf.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => setSelectedPdf(null)} className="text-[10px] text-red-500 hover:text-red-700 font-black hover:bg-red-50 px-3 py-1 rounded-lg transition-colors mt-2">
                      إزالة الملف
                    </button>
                  </div>
                )}
              </div>

              {/* DWG Dropzone */}
              <div 
                onDragOver={handleDragOverDwg}
                onDragLeave={handleDragLeaveDwg}
                onDrop={handleDropDwg}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 relative group cursor-pointer",
                  isDraggingDwg ? "border-teal-400 bg-teal-50/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-teal-200",
                  selectedDwg ? "border-teal-400 bg-teal-50/30" : ""
                )}
              >
                <input type="file" id="dwg-upload" className="hidden" accept=".dwg,.dxf" onChange={handleFileChangeDwg} />
                
                {!selectedDwg ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-black mb-1">رفع المخطط الأصلي (AutoCAD)</p>
                      <p className="text-xs text-slate-500 font-medium mb-4">صيغ مدعومة (.dwg, .dxf)</p>
                    </div>
                    <label htmlFor="dwg-upload" className="cursor-pointer bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm pointer-events-none">
                      استعراض (AutoCAD)
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-800 font-black text-sm mb-1 block truncate max-w-[150px] mx-auto">{selectedDwg.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{(selectedDwg.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => setSelectedDwg(null)} className="text-[10px] text-red-500 hover:text-red-700 font-black hover:bg-red-50 px-3 py-1 rounded-lg transition-colors mt-2">
                      إزالة الملف
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 mt-auto">
              <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors" disabled={isSubmitting}>
                إلغاء
              </button>
              <button type="submit" disabled={(!selectedPdf && !selectedDwg) || isSubmitting || !selectedProjectId || !selectedStageType} className="px-8 py-3 rounded-xl font-black bg-[#0D9488] text-white hover:bg-[#0B7A6F] active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2 shadow-lg shadow-teal-500/20">
                {isSubmitting ? 'جاري الرفع...' : 'تقديم المخطط'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
