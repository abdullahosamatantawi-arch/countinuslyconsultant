import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { suburbs as allSuburbs, getDistrictsBySuburb, getSuburbById, fetchPlotsFromSupabase, districts as allDistricts } from '../lib/data';
import type { Plot } from '../lib/data';
import { PlotCard } from './Plots';
import Fuse from 'fuse.js';

// ========== صفحة الضواحي ==========
const Suburbs: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get('search') || '').trim();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlots = async () => {
      setLoading(true);
      const allPlots = await fetchPlotsFromSupabase();
      setPlots(allPlots);
      setLoading(false);
    };
    loadPlots();
  }, []);

  // إعداد محرك البحث الذكي (Fuzzy Search)
  const fuse = React.useMemo(() => {
    const searchData = [
      ...allSuburbs.map(s => ({ ...s, type: 'suburb' as const })),
      ...allDistricts.map(d => ({ ...d, type: 'district' as const })),
      ...plots.map(p => ({ ...p, type: 'plot' as const }))
    ];
    return new Fuse(searchData, {
      keys: ['name', 'plotNumber'],
      threshold: 0.4, // درجة التسامح (تقريب النتائج)
      distance: 100,
      includeScore: true
    });
  }, [plots]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div style={{ fontSize: '2rem' }}>⌛</div>
          <h3>جاري تحميل البيانات...</h3>
        </div>
      </div>
    );
  }

  // تصفية النتائج بناءً على البحث الذكي
  const searchResults = searchQuery ? fuse.search(searchQuery) : [];

  const matchingPlots = searchResults
    .filter((r: any) => r.item.type === 'plot')
    .map((r: any) => r.item as Plot);

  const matchingDistricts = searchResults
    .filter((r: any) => r.item.type === 'district')
    .map((r: any) => r.item as any);

  const filteredSuburbs = searchQuery
    ? searchResults.filter((r: any) => r.item.type === 'suburb').map((r: any) => r.item as any)
    : allSuburbs;

  const hasResults = searchQuery ? searchResults.length > 0 : true;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link>
        <span className="breadcrumb-separator">‹</span>
        <span>الضاحية</span>
      </div>
      <div className="page-container">
        <div className="page-header">
          <h2>🏘️ {searchQuery ? `نتائج البحث عن: ${searchQuery}` : 'جميع الضواحي'}</h2>
          <p>
            {searchQuery
              ? `تم العثور على نتائج متنوعة تطابق بحثك`
              : 'اختر الضاحية التي تودّ الاستعراض فيها'}
          </p>
          {searchQuery && (
            <button
              onClick={() => navigate('/suburbs')}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'var(--green-xpale)',
                color: 'var(--green-dark)',
                border: '1px solid var(--green-pale)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              ✕ مسح البحث
            </button>
          )}
        </div>

        {!hasResults && searchQuery ? (
          <div className="empty-state" style={{ padding: '4rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3>لا توجد نتائج تطابق بحثك</h3>
            <p style={{ color: 'var(--text-light)', maxWidth: '400px', margin: '0.5rem auto' }}>
              جرّب البحث بكلمات أخرى أو تأكد من كتابة اسم الضاحية أو رقم القطعة بشكل صحيح.
            </p>
            <button
              onClick={() => navigate('/suburbs')}
              className="btn btn-primary"
              style={{ marginTop: '1.5rem' }}
            >
              عرض جميع الضواحي
            </button>
          </div>
        ) : (
          <>
            {/* Matching Plots Section */}
            {matchingPlots.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--green-dark)', borderRight: '4px solid var(--gold-main)', paddingRight: '0.75rem' }}>
                  الأراضي المطابقة ({matchingPlots.length})
                </h3>
                <div className="cards-grid">
                  {matchingPlots.map((plot: Plot) => (
                    <PlotCard
                      key={plot.id}
                      plot={plot}
                      onClick={() => navigate(`/suburbs/${plot.suburbId}/districts/${plot.districtId}/plots/${plot.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Matching Districts Section */}
            {matchingDistricts.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--green-dark)', borderRight: '4px solid var(--gold-main)', paddingRight: '0.75rem' }}>
                  المناطق المطابقة ({matchingDistricts.length})
                </h3>
                <div className="cards-grid">
                  {matchingDistricts.map((district: any) => (
                    <a
                      key={district.id}
                      onClick={() => navigate(`/suburbs/${district.suburbId}/districts/${district.id}`)}
                      className="suburb-card"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="suburb-card-icon">🗺️</div>
                      <h3>منطقة {district.name}</h3>
                      <p className="subtitle">{district.description}</p>
                      <div className="suburb-card-footer">
                        <span className="card-arrow" style={{ fontSize: '1.2rem' }}>عرض الأراضي ←</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Suburbs Section */}
            {(filteredSuburbs.length > 0 && (!searchQuery || matchingPlots.length === 0)) && (
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--green-dark)', borderRight: '4px solid var(--gold-main)', paddingRight: '0.75rem' }}>
                  {searchQuery ? 'الضاحية المطابقة' : 'تصفح الضاحية'}
                </h3>
                <div className="cards-grid">
                  {filteredSuburbs.map((suburb: any) => {
                    const availableCount = plots.filter((p: Plot) => p.suburbId === suburb.id && p.isAvailable).length;
                    return (
                      <a
                        key={suburb.id}
                        onClick={() => navigate(`/suburbs/${suburb.id}`)}
                        className="suburb-card"
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="suburb-card-icon">{suburb.emoji}</div>
                        <h3>{suburb.name}</h3>
                        <p className="subtitle">{suburb.description}</p>
                        <div className="suburb-card-footer">
                          <span className="plots-badge">{availableCount} أرض متاحة</span>
                          <span className="card-arrow" style={{ fontSize: '1.2rem' }}>←</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <footer className="footer">
        <p>© 2026 <strong>دائرة الشؤون الإسلامية — الشارقة</strong></p>
      </footer>
    </div>
  );
};

// ========== صفحة تفاصيل الضاحية ==========
export const SuburbDetail: React.FC = () => {
  const { suburbId } = useParams<{ suburbId: string }>();
  const navigate = useNavigate();
  const suburb = getSuburbById(suburbId!);
  const districts = getDistrictsBySuburb(suburbId!);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlots = async () => {
      setLoading(true);
      const allPlots = await fetchPlotsFromSupabase();
      setPlots(allPlots);
      setLoading(false);
    };
    loadPlots();
  }, []);

  if (!suburb) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>الضاحية غير موجودة</h3>
          <p>لم نتمكن من إيجاد هذه الضاحية</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div style={{ fontSize: '2rem' }}>⌛</div>
          <h3>جاري تحميل بيانات الضاحية...</h3>
        </div>
      </div>
    );
  }

  const suburbAvailableCount = plots.filter(p => p.suburbId === suburbId && p.isAvailable).length;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link>
        <span className="breadcrumb-separator">‹</span>
        <Link to="/suburbs">الضاحية</Link>
        <span className="breadcrumb-separator">‹</span>
        <span>{suburb.name}</span>
      </div>

      {/* Suburb Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--green-dark), var(--green-main))',
        padding: '3rem 2rem',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{suburb.emoji}</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          ضاحية {suburb.name}
        </h2>
        <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>{suburb.description}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gold-light)' }}>
              {suburbAvailableCount}
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>أرض متاحة</div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gold-light)' }}>
              {districts.length}
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>منطقة</div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="page-header">
          <h2>مناطق ضاحية {suburb.name}</h2>
          <p>اختر المنطقة للاطلاع على الأراضي المتاحة</p>
        </div>

        <div className="cards-grid">
          {districts.map(district => {
            const availableCount = plots.filter(p => p.districtId === district.id && p.isAvailable).length;
            return (
              <a
                key={district.id}
                onClick={() => navigate(`/suburbs/${suburbId}/districts/${district.id}`)}
                className="suburb-card"
                style={{ cursor: 'pointer' }}
              >
                <div className="suburb-card-icon">🗺️</div>
                <h3>{district.name}</h3>
                <p className="subtitle">{district.description}</p>
                <div className="suburb-card-footer">
                  <span className="plots-badge">{availableCount} أرض متاحة</span>
                  <span className="card-arrow" style={{ fontSize: '1.2rem' }}>←</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 <strong>دائرة الشؤون الإسلامية — الشارقة</strong></p>
      </footer>
    </div>
  );
};

export default Suburbs;
