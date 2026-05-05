// src/lib/data.ts
// بيانات منصة تبرعات بناء المساجد — دائرة الشؤون الإسلامية بالشارقة

export interface Suburb {
  id: string;
  name: string;
  description: string;
  totalPlots: number;
  availablePlots: number;
  emoji: string;
}

export interface District {
  id: string;
  suburbId: string;
  name: string;
  description: string;
  totalPlots: number;
  availablePlots: number;
}

export interface Plot {
  id: string;
  districtId: string;
  suburbId: string;
  name: string;
  plotNumber: string;
  section: string;
  aerialImageUrl?: string;
  areaSqm: number;
  worshippersCapacity: number;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  description?: string;
  notes?: string;
}

export interface DonorInquiry {
  id: string;
  plotId: string;
  plotName: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  message?: string;
  createdAt: string;
}

// ========== الضواحي ==========
export const suburbs: Suburb[] = [
  {
    id: 'muhadhdhab',
    name: 'مهذب',
    description: 'ضاحية مهذب — إمارة الشارقة. تضم منطقة القطينة التي تحتوي على أراضٍ شاغرة مخصصة لبناء المساجد.',
    totalPlots: 3,
    availablePlots: 3,
    emoji: '🕌',
  },
];

// ========== المناطق ==========
export const districts: District[] = [
  {
    id: 'qatinah',
    suburbId: 'muhadhdhab',
    name: 'القطينة',
    description: 'منطقة القطينة — ضاحية مهذب. تضم عدة أقسام فيها أراضٍ شاغرة معتمدة لبناء المساجد.',
    totalPlots: 3,
    availablePlots: 3,
  },
];

// ========== الأراضي — القطينة ==========
export const plots: Plot[] = [
  // ===== القطينة 2 — قطعة 408 =====
  {
    id: 'qt2-408',
    districtId: 'qatinah',
    name: 'القطينة 2 — قطعة رقم 408',
    plotNumber: '408',
    section: 'القطينة 2',
    aerialImageUrl: '/aerial/plot-408.png',
    suburbId: 'muhadhdhab',
    areaSqm: 7095,
    worshippersCapacity: 500,
    latitude: 25.401143036040327,
    longitude: 55.67836912603216,
    isAvailable: true,
    description: 'أرض شاغرة في القطينة 2 مخصصة لبناء مسجد. تقع في موقع استراتيجي يخدم سكان المنطقة المحيطة. في الصورة الجوية: العلامة الزرقاء تشير إلى موقع القطعة رقم 408، والعلامات الصفراء تدل على أراضي مساجد تحت الدراسة.',
  },
  // ===== القطينة 6 — قطعة 202 (المنطقة الخالية 1) =====
  {
    id: 'qt6-202',
    districtId: 'qatinah',
    name: 'القطينة 6 — قطعة رقم 202',
    plotNumber: '202',
    section: 'القطينة 6',
    aerialImageUrl: '/aerial/plot-202.png',
    suburbId: 'muhadhdhab',
    areaSqm: 5163,
    worshippersCapacity: 500,
    latitude: 25.396682963282135,
    longitude: 55.70627040993723,
    isAvailable: true,
    description: 'أرض شاغرة (المنطقة الخالية 1) في القطينة 6. موقع مميز يخدم عدداً كبيراً من السكان المجاورين. في الصورة الجوية: العلامة الزرقاء تشير إلى موقع القطعة رقم 202، والعلامات الصفراء تدل على أراضي مساجد تحت الدراسة.',
  },
  // ===== القطينة 6 — قطعة 347 (المنطقة الخالية 2) =====
  {
    id: 'qt6-347',
    districtId: 'qatinah',
    name: 'القطينة 6 — قطعة رقم 347',
    plotNumber: '347',
    section: 'القطينة 6',
    aerialImageUrl: '/aerial/plot-347.png',
    suburbId: 'muhadhdhab',
    areaSqm: 2976,
    worshippersCapacity: 500,
    latitude: 25.392314233044065,
    longitude: 55.70344129257508,
    isAvailable: true,
    description: 'أرض شاغرة (المنطقة الخالية 2) في القطينة 6. قطعة واسعة مناسبة لإنشاء مسجد 2026. في الصورة الجوية: العلامة الزرقاء تشير إلى موقع القطعة رقم 347، والعلامات الصفراء تدل على أراضي مساجد تحت الدراسة.',
  },
  // ===== القطينة 1 — قطعة 126 =====
  {
    id: 'qt1-126',
    districtId: 'qatinah',
    name: 'القطينة 1 — قطعة رقم 126',
    plotNumber: '126',
    section: 'القطينة 1',
    suburbId: 'muhadhdhab',
    areaSqm: 7730,
    worshippersCapacity: 500,
    latitude: 25.409304571608235,
    longitude: 55.690817622354125,
    aerialImageUrl: '/aerial/plot-126.png',
    isAvailable: true,
    description: 'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 1. يظهر في الصورة الجوية موقع القطعة رقم 126.',
  },
  // ===== القطينة 6 — قطعة 76 =====
  {
    id: 'qt6-76',
    districtId: 'qatinah',
    name: 'القطينة 6 — قطعة رقم 76',
    plotNumber: '76',
    section: 'القطينة 6',
    suburbId: 'muhadhdhab',
    areaSqm: 7730,
    worshippersCapacity: 500,
    latitude: 25.3963865788818,
    longitude: 55.6997120649043,
    aerialImageUrl: '/aerial/plot-76.png',
    isAvailable: true,
    description: 'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 6. يظهر في الصورة الجوية موقع القطعة رقم 76.',
  },
  // ===== القطينة 2 — قطعة 125 =====
  {
    id: 'qt2-125',
    districtId: 'qatinah',
    name: 'القطينة 2 — قطعة رقم 125',
    plotNumber: '125',
    section: 'القطينة 2',
    suburbId: 'muhadhdhab',
    areaSqm: 4263,
    worshippersCapacity: 500,
    latitude: 25.403366691345337,
    longitude: 55.68711722135374,
    aerialImageUrl: '/aerial/plot-125.png',
    isAvailable: true,
    description: 'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 2. يظهر في الصورة الجوية موقع القطعة رقم 125.',
  },
  // ===== القطينة 3 — قطعة 241 =====
  {
    id: 'qt3-241',
    districtId: 'qatinah',
    name: 'القطينة 3 — قطعة رقم 241',
    plotNumber: '241',
    section: 'القطينة 3',
    suburbId: 'muhadhdhab',
    areaSqm: 3421,
    worshippersCapacity: 500,
    latitude: 25.402370058402774,
    longitude: 55.696397507355876,
    aerialImageUrl: '/aerial/plot-241.png',
    isAvailable: true,
    description: 'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 3. يظهر في الصورة الجوية موقع القطعة رقم 241.',
  },
  // ===== القطينة 4 — قطعة 423 =====
  {
    id: 'qt4-423',
    districtId: 'qatinah',
    name: 'القطينة 4 — قطعة رقم 423',
    plotNumber: '423',
    section: 'القطينة 4',
    suburbId: 'muhadhdhab',
    areaSqm: 2949,
    worshippersCapacity: 500,
    latitude: 25.398936142157627,
    longitude: 55.687751205732184,
    aerialImageUrl: '/aerial/plot-423.png',
    isAvailable: true,
    description: 'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 4. يظهر في الصورة الجوية موقع القطعة رقم 423.',
  },
  // ===== القطينة 4 — قطعة 307 =====
  {
    id: 'qt4-307',
    districtId: 'qatinah',
    name: 'القطينة 4 — قطعة رقم 307',
    plotNumber: '307',
    section: 'القطينة 4',
    suburbId: 'muhadhdhab',
    areaSqm: 2700,
    worshippersCapacity: 500,
    latitude: 25.396423269917086,
    longitude: 55.692230031647675,
    aerialImageUrl: '/aerial/plot-307.png',
    isAvailable: true,
    description: 'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 4. يظهر في الصورة الجوية موقع القطعة رقم 307.',
  },
  // ===== القطينة 5 — قطعة 547 =====
  {
    id: 'qt5-547',
    districtId: 'qatinah',
    name: 'القطينة 5 — قطعة رقم 547',
    plotNumber: '547',
    section: 'القطينة 5',
    suburbId: 'muhadhdhab',
    areaSqm: 2675,
    worshippersCapacity: 500,
    latitude: 25.40240984014691,
    longitude: 55.70276087146766,
    aerialImageUrl: '/aerial/plot-547.png',
    isAvailable: true,
    description: 'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 5. يظهر في الصورة الجوية موقع القطعة رقم 547.',
  },
  // ===== القطينة 5 — قطعة 411 =====
  {
    id: 'qt5-411',
    districtId: 'qatinah',
    name: 'القطينة 5 — قطعة رقم 411',
    plotNumber: '411',
    section: 'القطينة 5',
    suburbId: 'muhadhdhab',
    areaSqm: 2975,
    worshippersCapacity: 500,
    latitude: 25.400647529387488,
    longitude: 55.70780801873864,
    aerialImageUrl: '/aerial/plot-411.png',
    isAvailable: true,
    description: 'أرض شاغرة مخصصة لبناء مسجد في منطقة القطينة 5. يظهر في الصورة الجوية موقع القطعة رقم 411.',
  },
];

// ========== Supabase Data Fetching ==========
import { supabase } from './supabase';

export let donorInquiries: DonorInquiry[] = [];

export const fetchPlotsFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('plots')
      .select('*');
    
    if (error) throw error;
    
    // تحويل البيانات من أسماء SQL (snake_case) إلى أسماء Typescript (camelCase)
    return data.map((p: any) => ({
      id: p.id,
      districtId: p.district_id,
      name: p.name,
      plotNumber: p.plot_number,
      section: p.section,
      aerialImageUrl: p.aerial_image_url,
      suburbId: p.suburb_id,
      areaSqm: p.area_sqm,
      worshippersCapacity: p.worshippers_capacity,
      latitude: p.latitude,
      longitude: p.longitude,
      isAvailable: p.is_available,
      description: p.description,
      notes: p.notes
    })) as Plot[];
  } catch (error) {
    console.error('Error fetching plots:', error);
    return plots; // العودة للبيانات الثابتة في حال الفشل
  }
};

export const updatePlotAvailability = async (plotId: string, isAvailable: boolean) => {
  try {
    const { error } = await supabase
      .from('plots')
      .update({ is_available: isAvailable })
      .eq('id', plotId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating plot status:', error);
    return false;
  }
};

// ========== Helper Functions ==========
export const getSuburbById = (id: string) => suburbs.find(s => s.id === id);
export const getDistrictById = (id: string) => districts.find(d => d.id === id);

// سنقوم بجعل الدوال التالية تدعم حالياً البيانات الثابتة ريثما يتم تحديث المكونات للأداء غير المتزامن
export const getPlotById = (id: string) => plots.find(p => p.id === id);

export const getDistrictsBySuburb = (suburbId: string) =>
  districts.filter(d => d.suburbId === suburbId);

export const getPlotsByDistrict = (districtId: string) =>
  plots.filter(p => p.districtId === districtId);

export const formatArea = (sqm: number) =>
  sqm.toLocaleString('ar-SA') + ' م²';

export const formatWorshippers = (n: number) =>
  n.toLocaleString('ar-SA') + ' مصلٍ';

export const addDonorInquiry = (inquiry: Omit<DonorInquiry, 'id' | 'createdAt'>) => {
  const newInquiry: DonorInquiry = {
    ...inquiry,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  donorInquiries = [newInquiry, ...donorInquiries];
  return newInquiry;
};

// أقسام القطينة المتوفرة
export const getUniqueSections = (items: Plot[] = plots) => {
  return [...new Set(items.map(p => p.section))];
};
// ========== التصاميم المعمارية ==========
export const architecturalDesigns = [
  { id: 'd285', title: 'تصميم معماري لمسجد (285 مصلٍ)', pdfUrl: '/designs/design-285.pdf', icon: '🏰', imageUrl: '/designs/mosque-285.png' },
  { id: 'd150', title: 'تصميم معماري لمسجد (150 مصلٍ)', pdfUrl: '/designs/design-150.pdf', icon: '🕌', imageUrl: '/designs/mosque-150.png' },
  { id: 'd515', title: 'تصميم معماري لمسجد (515 مصلٍ)', pdfUrl: '/designs/design-515.pdf', icon: '🕌', imageUrl: '/designs/mosque-150.png' },
  { id: 'd400', title: 'تصميم معماري لمسجد (400 مصلٍ)', pdfUrl: '/designs/design-400.pdf', icon: '🕌', imageUrl: '/designs/mosque-400.png' },
  { id: 'd250', title: 'تصميم معماري لمسجد (250 مصلٍ)', pdfUrl: '/designs/design-250.pdf', icon: '🕌', imageUrl: '/designs/mosque-150.png' },
  { id: 'd520', title: 'تصميم معماري لمسجد (520 مصلٍ)', pdfUrl: '/designs/design-520.pdf', icon: '🕌', imageUrl: '/designs/mosque-400.png' },
];
