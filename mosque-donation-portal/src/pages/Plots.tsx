import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getDistrictById, getSuburbById,
  formatArea, formatWorshippers, fetchPlotsFromSupabase
} from '../lib/data';
import type { Plot } from '../lib/data';

const Plots: React.FC = () => {
  const { suburbId, districtId } = useParams<{ suburbId: string; districtId: string }>();
  const navigate = useNavigate();
  const district = getDistrictById(districtId!);
  const suburb = getSuburbById(suburbId!);

  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [filterAvailable, setFilterAvailable] = useState('all');
  const [filterSection, setFilterSection] = useState('all');

  React.useEffect(() => {
    const loadPlots = async () => {
      setLoading(true);
      const allPlots = await fetchPlotsFromSupabase();
      const districtPlots = allPlots.filter(p => p.districtId === districtId);
      setPlots(districtPlots);
      setLoading(false);
    };
    loadPlots();
  }, [districtId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="loading-spinner" style={{ fontSize: '2rem' }}>⌛</div>
          <h3>جاري تحميل القائمة...</h3>
        </div>
      </div>
    );
  }

  if (!district || !suburb) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>المنطقة غير موجودة</h3>
        </div>
      </div>
    );
  }

  // Extract unique sections from plot data
  const sections = [...new Set(plots.map(p => p.section))];

  let filtered = plots.filter(p => {
    if (filterAvailable === 'available') return p.isAvailable;
    if (filterAvailable === 'unavailable') return !p.isAvailable;
    return true;
  });

  if (filterSection !== 'all') {
    filtered = filtered.filter(p => p.section === filterSection);
  }

  if (sortBy === 'area-asc') filtered = [...filtered].sort((a, b) => a.areaSqm - b.areaSqm);
  if (sortBy === 'area-desc') filtered = [...filtered].sort((a, b) => b.areaSqm - a.areaSqm);
  if (sortBy === 'worshippers-desc') filtered = [...filtered].sort((a, b) => b.worshippersCapacity - a.worshippersCapacity);

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link>
        <span className="breadcrumb-separator">‹</span>
        <Link to="/suburbs">الضاحية</Link>
        <span className="breadcrumb-separator">‹</span>
        <Link to={`/suburbs/${suburbId}`}>{suburb.name}</Link>
        <span className="breadcrumb-separator">‹</span>
        <span>{district.name}</span>
      </div>

      {/* District Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--green-dark), var(--green-mid))',
        padding: '2.5rem 2rem',
        color: 'white',
      }}>
        <div className="page-container" style={{ padding: '0' }}>
          <p style={{ opacity: 0.75, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            ضاحية {suburb.name}
          </p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem' }}>
            🗺️ منطقة {district.name}
          </h2>
          {/* Section Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterSection('all')}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '100px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                fontWeight: 700,
                fontSize: '0.82rem',
                background: filterSection === 'all' ? 'var(--gold-main)' : 'rgba(255,255,255,0.15)',
                color: 'white',
                transition: 'all 0.2s',
              }}
            >
              جميع الأقسام
            </button>
            {sections.map(section => (
              <button
                key={section}
                onClick={() => setFilterSection(section)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '100px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  background: filterSection === section ? 'var(--gold-main)' : 'rgba(255,255,255,0.15)',
                  color: 'white',
                  transition: 'all 0.2s',
                }}
              >
                {section}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container">
        {/* Filter Bar */}
        <div className="filter-bar">
          <label>الحالة:</label>
          <select className="filter-select" value={filterAvailable} onChange={e => setFilterAvailable(e.target.value)}>
            <option value="all">الكل</option>
            <option value="available">متاح فقط</option>
            <option value="unavailable">محجوز</option>
          </select>
          <label style={{ marginRight: '1rem' }}>الترتيب:</label>
          <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="default">الافتراضي</option>
            <option value="area-asc">المساحة: الأصغر أولاً</option>
            <option value="area-desc">المساحة: الأكبر أولاً</option>
            <option value="worshippers-desc">الطاقة الاستيعابية: الأعلى</option>
          </select>
          <span className="results-count">{filtered.length} قطعة</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>لا توجد نتائج</h3>
            <p>لا توجد قطع أراضٍ تطابق الفلتر المحدد</p>
          </div>
        ) : (
          <div className="cards-grid">
            {filtered.map(plot => (
              <PlotCard
                key={plot.id}
                plot={plot}
                onClick={() => navigate(`/suburbs/${suburbId}/districts/${districtId}/plots/${plot.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2026 <strong>دائرة الشؤون الإسلامية — الشارقة</strong></p>
      </footer>
    </div>
  );
};

const PlotCard: React.FC<{ plot: Plot; onClick: () => void }> = ({ plot, onClick }) => (
  <a className="plot-card" onClick={onClick} style={{ cursor: 'pointer' }}>
    <div className="plot-card-image">
      {plot.aerialImageUrl ? (
        <img src={plot.aerialImageUrl} alt={plot.name} />
      ) : (
        <img
          src={`https://maps.googleapis.com/maps/api/staticmap?center=${plot.latitude},${plot.longitude}&zoom=18&size=600x400&maptype=satellite&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
          title={plot.name}
        />
      )}
      <span className={`plot-available-badge ${plot.isAvailable ? '' : ''}`} style={{
        background: plot.isAvailable ? '#22c55e' : '#94a3b8',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', display: 'inline-block' }} />
        {plot.isAvailable ? 'متاح' : 'محجوز'}
      </span>
      <span className="plot-area-badge">{formatArea(plot.areaSqm)}</span>
    </div>
    <div className="plot-card-body">
      <h3>{plot.name}</h3>
      <div className="plot-meta">
        <div className="plot-meta-item">
          <span>📐</span>
          <span>{formatArea(plot.areaSqm)}</span>
        </div>
        <div className="plot-meta-item">
          <span>🕌</span>
          <span>{formatWorshippers(plot.worshippersCapacity)}</span>
        </div>
        <div className="plot-meta-item">
          <span>📍</span>
          <span>{plot.plotNumber}</span>
        </div>
      </div>
    </div>
  </a>
);

export { PlotCard };
export default Plots;
