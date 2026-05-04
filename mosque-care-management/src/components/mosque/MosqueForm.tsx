import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Mosque } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  X, 
  Save, 
  MapPin, 
  User, 
  Calendar, 
  Users, 
  HardHat, 
  Building2,
  Percent,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';

const mosqueSchema = z.object({
  plotNumber: z.string().min(1, 'رقم القطعة مطلوب'),
  area: z.string().min(1, 'المنطقة مطلوبة'),
  consultant: z.string().min(1, 'الاستشاري مطلوب'),
  contractor: z.string().min(1, 'المقاول مطلوب'),
  donor: z.string().optional(),
  menCapacity: z.number().min(0),
  womenCapacity: z.number().min(0),
  expectedOpeningDate: z.string().min(1, 'تاريخ الافتتاح المتوقع مطلوب'),
  currentWorks: z.string().optional(),
  visitDate: z.string().min(1, 'تاريخ الزيارة مطلوب'),
  completionPercentage: z.number().min(0).max(100),
  responsibleEngineer: z.string().min(1, 'المهندس المسؤول مطلوب'),
  status: z.enum(['pending', 'in_progress', 'completed', 'stopped']),
});

type MosqueFormData = z.infer<typeof mosqueSchema>;

interface MosqueFormProps {
  mosque?: Mosque;
  onSave: (data: MosqueFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const MosqueForm: React.FC<MosqueFormProps> = ({ mosque, onSave, onCancel, isOpen }) => {
  const { t } = useTranslation();
  
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<MosqueFormData>({
    resolver: zodResolver(mosqueSchema),
    defaultValues: {
      menCapacity: 0,
      womenCapacity: 0,
      completionPercentage: 0,
      status: 'in_progress',
    }
  });

  useEffect(() => {
    if (mosque) {
      reset({
        ...mosque,
        donor: mosque.donor || '',
        currentWorks: mosque.currentWorks || '',
      });
    } else {
      reset({
        menCapacity: 0,
        womenCapacity: 0,
        completionPercentage: 0,
        status: 'in_progress',
      });
    }
  }, [mosque, reset]);

  const menCap = watch('menCapacity') || 0;
  const womenCap = watch('womenCapacity') || 0;
  const totalCap = Number(menCap) + Number(womenCap);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark/20 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl border border-white/50 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-8 green-gradient flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Save size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{mosque ? t('edit') : t('add_mosque')}</h2>
              <p className="text-white/60 text-sm italic">يرجى تعبئة كافة الحقول المطلوبة</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Field: Plot Number */}
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <Building2 size={14} className="text-primary" />
                {t('plot_number')}
              </label>
              <input 
                {...register('plotNumber')}
                className={cn(
                  "w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all",
                  errors.plotNumber && "border-red-500"
                )}
              />
            </div>

            {/* Field: Area */}
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                {t('area')}
              </label>
              <input 
                {...register('area')}
                className={cn(
                  "w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all",
                  errors.area && "border-red-500"
                )}
              />
            </div>

            {/* Field: Consultant */}
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <User size={14} className="text-primary" />
                {t('consultant')}
              </label>
              <input 
                {...register('consultant')}
                className={cn(
                  "w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all",
                  errors.consultant && "border-red-500"
                )}
              />
            </div>

            {/* Field: Contractor */}
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <HardHat size={14} className="text-primary" />
                {t('contractor')}
              </label>
              <input 
                {...register('contractor')}
                className={cn(
                  "w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all",
                  errors.contractor && "border-red-500"
                )}
              />
            </div>

            {/* Field: Donor */}
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <User size={14} className="text-primary" />
                {t('donor')}
              </label>
              <input 
                {...register('donor')}
                className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Capacities */}
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <Users size={14} className="text-primary" />
                {t('men_capacity')}
              </label>
              <input 
                type="number"
                {...register('menCapacity', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <Users size={14} className="text-primary" />
                {t('women_capacity')}
              </label>
              <input 
                type="number"
                {...register('womenCapacity', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <Users size={14} className="text-secondary" />
                {t('total_capacity')}
              </label>
              <div className="w-full px-4 py-3 bg-secondary/10 rounded-2xl border border-secondary/20 text-secondary font-black">
                {totalCap}
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <Calendar size={14} className="text-primary" />
                {t('expected_opening')}
              </label>
              <input 
                type="date"
                {...register('expectedOpeningDate')}
                className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <Calendar size={14} className="text-primary" />
                {t('visit_date')}
              </label>
              <input 
                type="date"
                {...register('visitDate')}
                className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Engineer */}
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <User size={14} className="text-primary" />
                {t('responsible_engineer')}
              </label>
              <input 
                {...register('responsibleEngineer')}
                className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                {t('sync_status')}
              </label>
              <select 
                {...register('status')}
                className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold"
              >
                <option value="in_progress">{t('status_progress')}</option>
                <option value="completed">{t('status_completed')}</option>
                <option value="stopped">{t('status_stopped')}</option>
                <option value="pending">{t('status_pending')}</option>
              </select>
            </div>
          </div>

          {/* Completion Slider */}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-black text-dark/70 flex items-center gap-2">
                <Percent size={14} className="text-primary" />
                {t('completion_percentage')}
              </label>
              <span className="text-2xl font-black text-primary">{watch('completionPercentage')}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="100"
              {...register('completionPercentage', { valueAsNumber: true })}
              className="w-full h-3 bg-cream rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Current Works */}
          <div className="mt-8 space-y-2">
            <label className="text-sm font-black text-dark/70 flex items-center gap-2">
              <MessageSquare size={14} className="text-primary" />
              {t('current_works')}
            </label>
            <textarea 
              {...register('currentWorks')}
              rows={3}
              className="w-full px-4 py-3 bg-cream rounded-2xl border border-dark/5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none"
              placeholder="اكتب تفاصيل الأعمال الجارية في الموقع..."
            />
          </div>

          {/* Footer Buttons */}
          <div className="mt-10 flex gap-4">
            <button 
              type="submit"
              className="flex-1 py-4 green-gradient text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {t('save')}
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 bg-cream text-dark/50 font-black rounded-2xl hover:bg-dark/5 transition-all"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
