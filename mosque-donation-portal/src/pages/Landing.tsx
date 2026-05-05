import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { suburbs, plots as initialPlots, districts, fetchPlotsFromSupabase, architecturalDesigns } from '../lib/data';
import type { Plot } from '../lib/data';
import Fuse from 'fuse.js';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [plots, setPlots] = useState<Plot[]>(initialPlots);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const loadPlots = async () => {
      const allPlots = await fetchPlotsFromSupabase();
      setPlots(allPlots);
    };
    loadPlots();
  }, []);

  // إعداد محرك البحث الذكي (Fuzzy Search)
  const fuse = React.useMemo(() => {
    const searchData = [
      ...suburbs.map(s => ({ ...s, type: 'suburb' })),
      ...districts.map(d => ({ ...d, type: 'district' })),
      ...plots.map(p => ({ ...p, type: 'plot' }))
    ];
    return new Fuse(searchData, {
      keys: ['name', 'plotNumber'],
      threshold: 0.4, // درجة التسامح مع الأخطاء الإملائية
      distance: 100,
      includeScore: true
    });
  }, [plots]);

  useEffect(() => {
    if (search.trim().length > 1) {
      const results = fuse.search(search.trim()).slice(0, 6);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [search, fuse]);

  const availablePlotsTotal = plots.filter(p => p.isAvailable).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setShowSuggestions(false);
      navigate(`/suburbs?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleSuggestionClick = (item: any) => {
    setSearch(item.name || item.plotNumber);
    setShowSuggestions(false);
    if (item.type === 'suburb') {
      navigate(`/suburbs/${item.id}`);
    } else if (item.type === 'district') {
      navigate(`/suburbs/${item.suburbId}/districts/${item.id}`);
    } else if (item.type === 'plot') {
      navigate(`/suburbs/${item.suburbId}/districts/${item.districtId}/plots/${item.id}`);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-ornament" />

        <div className="hero-badge" style={{ position: 'relative' }}>
          <span>🌙</span>
          <span>إدارة بناء ورعاية المساجد — دائرة الشؤون الإسلامية</span>
        </div>

        <h2>
          تبرّع لبناء <span>مسجد</span><br />في الشارقة
        </h2>

        <p>
          استعرض الأراضي الشاغرة المخصصة لبناء المساجد في ضاحيات الشارقة،
          واختر القطعة التي تودّ المساهمة في تشييد مسجد عليها.
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="num">{availablePlotsTotal}</span>
            <span className="lbl">أرض متاحة</span>
          </div>
          <div className="hero-stat">
            <span className="num">{suburbs.length}</span>
            <span className="lbl">ضاحية</span>
          </div>
          <div className="hero-stat">
            <span className="num">٢</span>
            <span className="lbl">قسم بالقطينة</span>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="search-section" style={{ position: 'relative', zIndex: 1000 }}>
        <form className="search-box" onSubmit={handleSearch}>
          <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="ابحث عن ضاحية أو رقم قطعة او منطقة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => search.length > 1 && setShowSuggestions(true)}
          />
          <button type="submit" className="search-btn">
            بحث ذكي
          </button>
        </form>

        {/* Dropdown Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions">
            {suggestions.map(({ item }) => (
              <div
                key={`${item.type}-${item.id}`}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(item)}
              >
                <span className="suggestion-icon">
                  {item.type === 'suburb' ? '🏘️' : item.type === 'district' ? '🗺️' : '📍'}
                </span>
                <div className="suggestion-info">
                  <div className="suggestion-name">{item.name}</div>
                  <div className="suggestion-type">
                    {item.type === 'suburb' ? 'ضاحية' : item.type === 'district' ? 'منطقة' : `قطعة رقم ${item.plotNumber}`}
                  </div>
                </div>
                <span className="suggestion-arrow">←</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suburbs Grid */}
      <div className="page-container" style={{ marginTop: '1rem' }}>
        <div className="page-header">
          <h2>الضاحية المتاحة</h2>
          <p>اختر ضاحية للاطلاع على المناطق والأراضي المتاحة فيها</p>
        </div>

        <div className="cards-grid">
          {suburbs.map(suburb => {
            const availableCount = plots.filter(MathP => MathP.suburbId === suburb.id && MathP.isAvailable).length;
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
                  <span className="plots-badge">
                    {availableCount} أرض متاحة
                  </span>
                  <span className="card-arrow" style={{ fontSize: '1.2rem' }}>←</span>
                </div>
              </a>
            );
          })}
        </div>

        {/* Architectural Designs Section */}
        <section className="designs-section">
          <div className="page-header" style={{ textAlign: 'center' }}>
            <div className="hero-badge" style={{ marginBottom: '1rem' }}>
              <span>📐</span>
              التصاميم الهندسية
            </div>
            <h2 style={{ fontSize: '2rem' }}>نماذج معمارية معتمدة</h2>
            <p style={{ maxWidth: '600px', margin: '0.4rem auto' }}>
              اختر من بين مجموعة من التصاميم المعمارية المبتكرة والمعتمدة التي روعي فيها جمال العمارة الإسلامية وتلبية احتياجات المصلين.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem',
            marginTop: '3.5rem'
          }}>
            {architecturalDesigns.map((design: any) => {
              // Extract worshippers count for the badge
              const worshippers = design.title.match(/\d+/)?.[0] || '---';

              return (
                <div key={design.id} className="premium-design-card">
                  <div className="card-visual">
                    <img src={design.imageUrl || '/mosque-preview.png'} alt={design.title} />
                    <div className="card-overlay">
                      <div className="capacity-badge">
                        <span>🕌</span>
                        سعة {worshippers} مصلٍ
                      </div>
                    </div>
                  </div>

                  <div className="card-content">
                    <div className="card-info">
                      <h4>{design.title}</h4>
                      <p>
                        <span style={{ color: 'var(--gold-main)' }}>📄</span>
                        ملف بصيغة PDF • جاهز للتحميل
                      </p>
                    </div>

                    <div className="card-actions">
                      <a
                        href={design.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download"
                      >
                        <span>📥</span>
                        تحميل واستعراض التصميم
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <div style={{
          marginTop: '4rem',
          background: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.4rem', fontWeight: 900 }}>
            كيف تتم عملية التبرع؟
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            خطوات بسيطة للمساهمة في بناء بيوت الله
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { step: '١', icon: '🗺️', title: 'اختر الضاحية', desc: 'تصفح ضواحي الشارقة واختر المنطقة التي تفضلها' },
              { step: '٢', icon: '📍', title: 'اختر الأرض', desc: 'استعرض قطع الأراضي المتاحة وتفاصيل كل منها' },
              { step: '٣', icon: '✉️', title: 'أبدِ اهتمامك', desc: 'أرسل استفساراً وسيتواصل معك فريق الدائرة' },
              { step: '٤', icon: '🕌', title: 'ابنِ مسجدك', desc: 'تُشرف الدائرة على تنفيذ المشروع بحسب الشروط والمواصفات المعتمدة' },
            ].map((item) => (
              <div key={item.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64,
                  background: 'linear-gradient(135deg, var(--green-pale), var(--green-xpale))',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.75rem',
                  margin: '0 auto 1rem',
                  border: '1px solid var(--border)',
                }}>
                  {item.icon}
                </div>
                <div style={{
                  background: 'var(--green-main)',
                  color: 'white',
                  width: 24, height: 24,
                  borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 900,
                  margin: '0 auto 0.75rem',
                }}>
                  {item.step}
                </div>
                <h4 style={{ fontWeight: 800, marginBottom: '0.4rem', fontSize: '0.95rem' }}>{item.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 500 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          © 2026 <strong>دائرة الشؤون الإسلامية — الشارقة</strong>. جميع الحقوق محفوظة.
        </p>
        <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', opacity: 0.6 }}>
          للاستفسار يرجى زيارة موقعنا : <a href="https://www.sia.gov.ae" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>https://www.sia.gov.ae</a>
        </p>

      </footer>
    </div>
  );
};

export default Landing;
