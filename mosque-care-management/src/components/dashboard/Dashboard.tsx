import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Mosque } from '../../types';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Users,
  Landmark as MosqueIcon
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { cn } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-3xl border border-dark/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
  >
    <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10", color)}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-dark/50 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-black text-dark">{value}</h3>
        {trend && (
          <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp size={12} />
            {trend}
          </p>
        )}
      </div>
      <div className={cn("p-3 rounded-2xl text-white group-hover:scale-110 transition-transform", color)}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

export const Dashboard: React.FC<{ mosques: Mosque[] }> = ({ mosques }) => {
  const { t } = useTranslation();

  const stats = {
    total: mosques.length,
    avgProgress: Math.round(mosques.reduce((acc, m) => acc + m.completionPercentage, 0) / (mosques.length || 1)),
    completingThisMonth: mosques.filter(m => {
      if (!m.expectedOpeningDate) return false;
      const date = new Date(m.expectedOpeningDate);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    inProgress: mosques.filter(m => m.status === 'in_progress').length,
    stopped: mosques.filter(m => m.status === 'stopped').length,
    pending: mosques.filter(m => m.status === 'pending').length,
  };

  const barChartData = {
    labels: mosques.slice(0, 5).map(m => m.plotNumber),
    datasets: [
      {
        label: t('completion_percentage'),
        data: mosques.slice(0, 5).map(m => m.completionPercentage),
        backgroundColor: '#1B5E20',
        borderRadius: 8,
      },
    ],
  };

  const pieChartData = {
    labels: [t('status_progress'), t('status_completed'), t('status_stopped'), t('status_pending')],
    datasets: [
      {
        data: [stats.inProgress, mosques.filter(m => m.status === 'completed').length, stats.stopped, stats.pending],
        backgroundColor: ['#2E7D32', '#C9A84C', '#D32F2F', '#757575'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'Cairo',
            weight: 'bold' as const,
          }
        }
      },
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('total_mosques')} 
          value={stats.total} 
          icon={MosqueIcon} 
          color="bg-primary" 
          trend="+3 من الشهر الماضي"
        />
        <StatCard 
          title={t('avg_completion')} 
          value={`${stats.avgProgress}%`} 
          icon={TrendingUp} 
          color="bg-accent" 
        />
        <StatCard 
          title={t('completing_this_month')} 
          value={stats.completingThisMonth} 
          icon={Clock} 
          color="bg-secondary" 
        />
        <StatCard 
          title="سعة المصلين الإجمالية" 
          value={mosques.reduce((acc, m) => acc + m.totalCapacity, 0).toLocaleString()} 
          icon={Users} 
          color="bg-dark" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Bar Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-dark flex items-center gap-2">
              <TrendingUp className="text-primary" />
              توزيع نسب الإنجاز للمشاريع الحالية
            </h3>
            <button className="text-xs font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all">
              عرض التفاصيل
            </button>
          </div>
          <div className="h-[300px]">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white p-8 rounded-3xl border border-dark/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-dark flex items-center gap-2">
              <CheckCircle2 className="text-secondary" />
              حالة المشاريع
            </h3>
          </div>
          <div className="h-[300px]">
            <Pie data={pieChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Alerts / Recent Activity Section */}
      <div className="bg-white p-8 rounded-3xl border border-dark/5 shadow-sm">
        <h3 className="text-xl font-black text-dark mb-6 flex items-center gap-2">
          <AlertCircle className="text-red-500" />
          تنبيهات المتابعة العاجلة
        </h3>
        <div className="space-y-4">
          {mosques.filter(m => m.completionPercentage < 10 && m.status === 'in_progress').map(m => (
            <div key={m.id} className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white flex-shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-dark">{m.plotNumber} - {m.area}</p>
                <p className="text-sm text-dark/60">تقدم ضئيل ({m.completionPercentage}%) منذ آخر زيارة</p>
              </div>
              <button className="px-6 py-2 bg-white text-red-500 text-sm font-bold rounded-xl border border-red-200 hover:bg-red-500 hover:text-white transition-all">
                متابعة
              </button>
            </div>
          ))}
          {mosques.filter(m => m.completionPercentage === 100 && m.status !== 'completed').map(m => (
            <div key={m.id} className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-dark">{m.plotNumber} - {m.area}</p>
                <p className="text-sm text-dark/60">المشروع مكتمل بنسبة 100% وبانتظار الاعتماد النهائي</p>
              </div>
              <button className="px-6 py-2 bg-white text-green-500 text-sm font-bold rounded-xl border border-green-200 hover:bg-green-500 hover:text-white transition-all">
                اعتماد
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
