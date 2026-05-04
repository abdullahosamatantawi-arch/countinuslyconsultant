import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Mosque } from '../../types';
import { Edit3, Trash2, Eye } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';

interface MosqueTableProps {
  mosques: Mosque[];
  onEdit: (mosque: Mosque) => void;
  onDelete: (id: string) => void;
  onView: (mosque: Mosque) => void;
}

export const MosqueTable: React.FC<MosqueTableProps> = ({ mosques, onEdit, onDelete, onView }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-3xl border border-dark/5 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="bg-cream/50 border-b border-dark/5">
              <th className="px-6 py-5 text-start text-xs font-black text-dark/40 uppercase">{t('plot_number')}</th>
              <th className="px-6 py-5 text-start text-xs font-black text-dark/40 uppercase">{t('area')}</th>
              <th className="px-6 py-5 text-start text-xs font-black text-dark/40 uppercase">{t('responsible_engineer')}</th>
              <th className="px-6 py-5 text-start text-xs font-black text-dark/40 uppercase">{t('contractor')}</th>
              <th className="px-6 py-5 text-start text-xs font-black text-dark/40 uppercase">{t('completion_percentage')}</th>
              <th className="px-6 py-5 text-start text-xs font-black text-dark/40 uppercase">{t('expected_opening')}</th>
              <th className="px-6 py-5 text-end text-xs font-black text-dark/40 uppercase">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark/5">
            {mosques.map((mosque) => (
              <tr key={mosque.id} className="hover:bg-primary/5 transition-colors group">
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">
                    {mosque.plotNumber}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-dark">{mosque.area}</td>
                <td className="px-6 py-4 text-sm text-dark/60">{mosque.responsibleEngineer}</td>
                <td className="px-6 py-4 text-sm text-dark/60">{mosque.contractor}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden max-w-[100px]">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          mosque.completionPercentage === 100 ? "bg-green-500" : "bg-primary"
                        )}
                        style={{ width: `${mosque.completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-black text-primary">{mosque.completionPercentage}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-dark/60">{formatDate(mosque.expectedOpeningDate)}</td>
                <td className="px-6 py-4 text-end">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onView(mosque)}
                      className="p-2 text-dark/30 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => onEdit(mosque)}
                      className="p-2 text-dark/30 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(mosque.id)}
                      className="p-2 text-dark/30 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mosques.length === 0 && (
        <div className="p-20 text-center">
          <p className="text-dark/40 font-medium italic">لا توجد بيانات متاحة حالياً</p>
        </div>
      )}
    </div>
  );
};
