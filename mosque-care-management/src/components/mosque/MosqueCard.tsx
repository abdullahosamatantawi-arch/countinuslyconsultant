import React from 'react';
import type { Mosque } from '../../types';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  HardHat,
  Eye,
  MapPin,
  Users,
  Briefcase,
  Heart
} from 'lucide-react';

interface MosqueCardProps {
  mosque: Mosque;
  onEdit: (mosque: Mosque) => void;
  onView: (mosque: Mosque) => void;
}

export const MosqueCard: React.FC<MosqueCardProps> = ({ mosque, onView }) => {

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl border border-dark/5 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col"
    >
      {/* Card Header */}
      <div className="p-5 pb-0 flex justify-between items-start">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-4 py-1.5 green-gradient text-white text-xs font-black rounded-full shadow-lg shadow-primary/20">
            قطعة {mosque.plotNumber}
          </div>
          {mosque.area && (
            <div className="px-3 py-1 bg-dark/5 text-dark/70 text-xs font-bold rounded-full flex items-center gap-1.5">
              <MapPin size={12} />
              {mosque.area}
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1">
        {/* Main Work Status */}
        <div className="mb-5">
          <h3 className="text-xs font-black text-dark/40 mb-1.5 uppercase tracking-wider">الأعمال الجارية في الموقع:</h3>
          <p className="text-base font-bold text-dark leading-relaxed line-clamp-3 min-h-[4.5rem]">
            {mosque.currentWorks || 'لا توجد بيانات عن الأعمال الجارية'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-3 bg-cream/30 p-4 rounded-2xl border border-dark/5">
          {/* Consultant */}
          <div>
            <span className="text-[10px] font-black text-dark/40 block mb-1">الاستشاري</span>
            <div className="flex items-center gap-1.5 text-dark/80 text-xs font-bold">
              <Briefcase size={12} className="text-primary shrink-0" />
              <span className="truncate" title={mosque.consultant}>{mosque.consultant || '---'}</span>
            </div>
          </div>
          
          {/* Contractor */}
          <div>
            <span className="text-[10px] font-black text-dark/40 block mb-1">المقاول</span>
            <div className="flex items-center gap-1.5 text-dark/80 text-xs font-bold">
              <HardHat size={12} className="text-primary shrink-0" />
              <span className="truncate" title={mosque.contractor}>{mosque.contractor || '---'}</span>
            </div>
          </div>

          {/* Engineer */}
          <div>
            <span className="text-[10px] font-black text-dark/40 block mb-1">المهندس المسؤول</span>
            <div className="flex items-center gap-1.5 text-dark/80 text-xs font-bold">
              <User size={12} className="text-primary shrink-0" />
              <span className="truncate" title={mosque.responsibleEngineer}>{mosque.responsibleEngineer || '---'}</span>
            </div>
          </div>

          {/* Donor */}
          <div>
            <span className="text-[10px] font-black text-dark/40 block mb-1">المتبرع</span>
            <div className="flex items-center gap-1.5 text-dark/80 text-xs font-bold">
              <Heart size={12} className="text-red-400 shrink-0" />
              <span className="truncate" title={mosque.donor}>{mosque.donor || '---'}</span>
            </div>
          </div>

          {/* Opening Date */}
          <div>
            <span className="text-[10px] font-black text-dark/40 block mb-1">تاريخ الافتتاح المتوقع</span>
            <div className="flex items-center gap-1.5 text-dark/80 text-xs font-bold">
              <Calendar size={12} className="text-primary shrink-0" />
              <span className="truncate">{mosque.expectedOpeningDate || '---'}</span>
            </div>
          </div>

          {/* Capacity */}
          <div>
            <span className="text-[10px] font-black text-dark/40 block mb-1">إجمالي المصلين</span>
            <div className="flex items-center gap-1.5 text-dark/80 text-xs font-bold">
              <Users size={12} className="text-primary shrink-0" />
              <span className="truncate">{mosque.totalCapacity ? `${mosque.totalCapacity} مصلٍ` : '---'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 bg-cream/30 border-t border-dark/5">
         <button 
          onClick={() => onView(mosque)}
          className="w-full py-2.5 bg-white hover:bg-primary hover:text-white text-primary text-sm font-black rounded-xl border border-primary/10 shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Eye size={16} />
          عرض التفاصيل الكاملة
        </button>
      </div>
    </motion.div>
  );
};
