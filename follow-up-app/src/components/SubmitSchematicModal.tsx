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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedFile || !selectedProjectId || !selectedStageType || !user) return;
    
    setIsSubmitting(true);
    try {
      // 1. Upload File to Supabase Storage (Assumes 'schematics' bucket exists)
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${selectedProjectId}/${selectedStageType}_v1_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('schematics')
        .upload(fileName, selectedFile);

      if (uploadError) {
        // If bucket doesn't exist or RLS denies
        throw new Error("خطأ في رفع الملف. تأكد من وجود مساحة التخزين الخاصة بالمخططات.");
      }

      const fileUrl = `${supabase.storage.from('schematics').getPublicUrl(fileName).data.publicUrl}`;

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
        await supabase.from('project_stages').update({ status: 'submitted' }).eq('id', stageId);
      } else {
        // Mapping for Arabic names
        const stageNameMap: Record<string, string> = {
          architectural: 'اعتماد معماري',
          structural: 'اعتماد إنشائي',
          mep: 'اعتماد كهروميكانيكي',
          civil_defense: 'اعتماد الدفاع المدني',
          planning: 'تخطيط ومساحة',
          paint: 'ضمان الاصباغ الداخلية والخارجية',
          ac: 'ضمان التكييف',
          insulation: 'ضمان العزل'
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
            stage_order: count || 0
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
          file_url: fileUrl,
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
        setSelectedFile(null);
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity" onClick={onClose}></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 m-4">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-emerald-900">تقديم مخطط جديد للاعتماد</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-900 mb-2">تم رفع المخطط بنجاح!</h3>
            <p className="text-slate-500">تم إرسال المخطط للمراجعة الهندسية، سيتم إخطارك عند ورود أي ملاحظات.</p>
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
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all">
                  <option value="">-- اختر المشروع --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">نوع المخطط <span className="text-red-500">*</span></label>
                <select 
                  required 
                  value={selectedStageType}
                  onChange={e => setSelectedStageType(e.target.value as StageType)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all">
                  <option value="">-- اختر نوع المخطط --</option>
                  <option value="architectural">معماري (Architectural)</option>
                  <option value="structural">إنشائي (Structural)</option>
                  <option value="mep">كهروميكانيكي (MEP)</option>
                  <option value="civil_defense">دفاع مدني (Civil Defense)</option>
                  <option value="planning">تخطيط ومساحة (Planning)</option>
                  <option value="paint">ضمان الاصباغ (Paint Guarantee)</option>
                  <option value="ac">ضمان التكييف (AC Guarantee)</option>
                  <option value="insulation">ضمان العزل (Insulation Guarantee)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">ملاحظات للمراجعة الهندسية (اختياري)</label>
              <textarea 
                value={comments}
                onChange={e => setComments(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all min-h-[80px]"
                placeholder="أي توضيحات..."
              ></textarea>
            </div>

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 relative",
                isDragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
                selectedFile ? "border-emerald-500 bg-emerald-50/50" : ""
              )}
            >
              <input type="file" id="file-upload" className="hidden" accept=".pdf,.dwg,.zip" onChange={handleFileChange} />
              
              {!selectedFile ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600 border border-slate-100">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-700 font-bold mb-1">اسحب وأفلت ملف المخطط هنا</p>
                    <p className="text-sm text-slate-500 mb-2">أو قم بالنقر لاختيار ملف من جهازك</p>
                  </div>
                  <label htmlFor="file-upload" className="cursor-pointer bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                    استعراض الملفات
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-900 font-bold mb-1 block truncate max-w-xs mx-auto">{selectedFile.name}</p>
                    <p className="text-sm text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-sm text-red-500 hover:text-red-700 font-bold underline">
                    تبديل الملف
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3 mt-auto">
              <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors" disabled={isSubmitting}>
                إلغاء
              </button>
              <button type="submit" disabled={!selectedFile || isSubmitting || !selectedProjectId || !selectedStageType} className="px-6 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
                {isSubmitting ? 'جاري الرفع...' : 'تقديم للاعتماد'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
