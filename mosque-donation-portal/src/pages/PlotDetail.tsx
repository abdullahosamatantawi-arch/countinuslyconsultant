import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getDistrictById, getSuburbById,
  formatArea, addDonorInquiry,
  fetchPlotsFromSupabase, updatePlotAvailability
} from '../lib/data';
import type { Plot } from '../lib/data';

const PlotDetail: React.FC = () => {
  const { suburbId, districtId, plotId } = useParams<{
    suburbId: string; districtId: string; plotId: string;
  }>();

  const [plot, setPlot] = useState<Plot | null>(null);
  const [loading, setLoading] = useState(true);
  const district = getDistrictById(districtId!);
  const suburb = getSuburbById(suburbId!);
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    const loadPlot = async () => {
      setLoading(true);
      const allPlots = await fetchPlotsFromSupabase();
      const found = allPlots.find(p => p.id === plotId);
      setPlot(found || null);
      setLoading(false);
    };
    loadPlot();
  }, [plotId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="loading-spinner" style={{ fontSize: '2rem' }}>⌛</div>
          <h3>جاري تحميل بيانات الأرض...</h3>
        </div>
      </div>
    );
  }

  if (!plot || !district || !suburb) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>القطعة غير موجودة</h3>
          <p>لم نتمكن من إيجاد هذه القطعة</p>
        </div>
      </div>
    );
  }
  const googleMapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${plot.latitude},${plot.longitude}&zoom=18&maptype=satellite`;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link>
        <span className="breadcrumb-separator">‹</span>
        <Link to="/suburbs">الضواحي</Link>
        <span className="breadcrumb-separator">‹</span>
        <Link to={`/suburbs/${suburbId}`}>{suburb.name}</Link>
        <span className="breadcrumb-separator">‹</span>
        <Link to={`/suburbs/${suburbId}/districts/${districtId}`}>{district.name}</Link>
        <span className="breadcrumb-separator">‹</span>
        <span>{plot.plotNumber}</span>
      </div>

      <div className="page-container" style={{ marginTop: '1.5rem' }}>
        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, flex: 1 }}>{plot.name}</h2>
            <div style={{ flex: 1 }}></div>
            <span style={{
              background: plot.isAvailable ? '#dcfce7' : '#fee2e2',
              color: plot.isAvailable ? '#16a34a' : '#dc2626',
              padding: '0.35rem 1rem',
              borderRadius: '100px',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}>
              {plot.isAvailable ? '✅ متاح للتبرع' : '🔒 محجوز'}
            </span>
          </div>
          <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
            رقم القطعة: <strong style={{ color: 'var(--green-main)' }}>{plot.plotNumber}</strong>
          </p>
        </div>

        <div className="detail-layout">
          {/* Left: Image + Map */}
          <div>
            {/* Aerial Image / PDF Viewer */}
            <div className="detail-image" style={{ height: '550px' }}>
              {plot.aerialImageUrl ? (
                <img src={plot.aerialImageUrl} alt={plot.name} />
              ) : (
                <div className="detail-image-placeholder">
                  <span>🛰️</span>
                  <p>الصورة الجوية غير متوفرة حالياً</p>
                </div>
              )}

              <div style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'rgba(13,79,60,0.85)',
                color: 'white', padding: '0.4rem 0.9rem',
                borderRadius: '100px', fontSize: '0.78rem', fontWeight: 700,
                backdropFilter: 'blur(4px)',
                zIndex: 10
              }}>
                📐 {formatArea(plot.areaSqm)}
              </div>
            </div>

            {/* Description */}
            {plot.description && (
              <div style={{
                background: 'var(--white)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginTop: '1.5rem',
              }}>
                <h4 style={{ fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-dark)' }}>
                  📝 تفاصيل القطعة
                </h4>
                <p style={{ color: 'var(--text-mid)', fontSize: '0.9rem', lineHeight: 1.7, fontWeight: 500 }}>
                  {plot.description}
                </p>
              </div>
            )}

            {/* Map */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-dark)' }}>
                📍 الموقع على الخريطة
              </h4>
              <div className="detail-map">
                <iframe
                  src={googleMapsEmbedUrl}
                  title="موقع الأرض"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  loading="lazy"
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>
                الإحداثيات: {plot.latitude.toFixed(4)}°N, {plot.longitude.toFixed(4)}°E
              </p>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="detail-sidebar">
            <div className="detail-card">
              <div className="detail-card-header">
                <h2>تفاصيل الأرض</h2>
                <p>المعلومات الرسمية للقطعة رقم {plot.plotNumber}</p>
              </div>

              <div className="detail-specs">
                <div className="spec-item">
                  <div className="spec-icon">📐</div>
                  <div className="spec-info">
                    <label>المساحة الكلية</label>
                    <div className="val">{plot.areaSqm.toLocaleString('ar-SA')} <span>م²</span></div>
                  </div>
                </div>

                <div className="spec-item">
                  <div className="spec-icon">🕌</div>
                  <div className="spec-info">
                    <label>الطاقة الاستيعابية التقديرية</label>
                    <div className="val">{plot.worshippersCapacity.toLocaleString('ar-SA')} <span>مصلٍ</span></div>
                  </div>
                </div>

                <div className="spec-item">
                  <div className="spec-icon">📍</div>
                  <div className="spec-info">
                    <label>المنطقة</label>
                    <div className="val" style={{ fontSize: '0.95rem' }}>{district.name}</div>
                  </div>
                </div>

                <div className="spec-item">
                  <div className="spec-icon">🏘️</div>
                  <div className="spec-info">
                    <label>الضاحية</label>
                    <div className="val" style={{ fontSize: '0.95rem' }}>ضاحية {suburb.name}</div>
                  </div>
                </div>

                <div className="spec-item">
                  <div className="spec-icon">🔢</div>
                  <div className="spec-info">
                    <label>رقم القطعة</label>
                    <div className="val" style={{ fontSize: '0.95rem' }}>{plot.plotNumber}</div>
                  </div>
                </div>
              </div>

              {plot.isAvailable && (
                <div className="donation-cta">
                  <button className="cta-btn" onClick={() => setShowModal(true)}>
                    <span>💚</span>
                    مهتم ببناء مسجد في هذه المنطقة
                  </button>
                  <p className="cta-note">
                    سيتم التواصل معك قريبا
                  </p>
                </div>
              )}

              {!plot.isAvailable && (
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{
                    background: '#fee2e2', color: '#dc2626',
                    padding: '1rem', borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem', fontWeight: 700,
                  }}>
                    🔒 هذه القطعة محجوزة حالياً
                  </div>
                </div>
              )}
            </div>

            {/* Share */}
            <div style={{
              background: 'var(--gold-pale)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              marginTop: '1rem',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--gold-dark)', fontWeight: 700 }}>
                🤝 شارك هذه الفرصة مع من تعرف
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--gold-dark)', opacity: 0.8, marginTop: '0.4rem' }}>
                "من دلّ على خير فله مثل أجر فاعله"
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 <strong>دائرة الشؤون الإسلامية — الشارقة</strong></p>
      </footer>

      {/* Donation Modal */}
      {showModal && (
        <DonationModal
          plotId={plot.id}
          plotName={plot.name}
          onClose={() => setShowModal(false)}
          onSuccess={() => setPlot(p => p ? { ...p, isAvailable: false } : p)}
        />
      )}
    </div>
  );
};

import { supabase } from '../lib/supabase';

// ===== Donation Modal =====
const DonationModal: React.FC<{
  plotId: string;
  plotName: string;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ plotId, plotName, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [idDragActive, setIdDragActive] = useState(false);
  const [passportDragActive, setPassportDragActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let idUrl = '';
      let passportUrl = '';

      if (idFile) {
        idUrl = await uploadFile(idFile, 'id-cards');
      }
      if (passportFile) {
        passportUrl = await uploadFile(passportFile, 'passports');
      }

      const fullPhoneNumber = `971${form.phone.replace(/^0+/, '')}`;

      const { error: dbError } = await supabase
        .from('donor_inquiries')
        .insert([{
          plot_id: plotId,
          plot_name: plotName,
          donor_name: form.name,
          donor_phone: fullPhoneNumber,
          donor_email: form.email,
          message: form.message,
          id_card_url: idUrl,
          passport_url: passportUrl,
        }]);

      if (dbError) throw dbError;

      // Also keep local fallback
      addDonorInquiry({
        plotId,
        plotName,
        donorName: form.name,
        donorPhone: fullPhoneNumber,
        donorEmail: form.email,
        message: form.message,
      });

      // Send SMS confirmation via serverless API
      try {
        const smsMessage = `شكراً لحسن تعاونكم معنا السيد/ة ${form.name}، تم استلام طلبكم بنجاح بخصوص بناء مسجد في منطقة ${plotName}. سيتم التواصل معكم قريباً بإذن الله وتفضلو بقبول كامل التقدير والإحترام. - دائرة الشؤون الإسلامية`;

        console.log('DEBUG: Sending SMS update to:', fullPhoneNumber);
        const smsResponse = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: fullPhoneNumber,
            message: smsMessage,
          }),
        });

        const smsResult = await smsResponse.json();
        console.log('SMS API result details:', smsResult);

        if (!smsResponse.ok || !smsResult.success) {
          console.error('SMS sending failed. Check Server/Vite logs. Result:', smsResult);
        } else {
          console.log('SMS sent successfully!');
        }
      } catch (smsErr) {
        console.error('SMS fetch network error:', smsErr);
      }

      // Send Email confirmation via Resend API
      try {
        const emailHtml = `
          <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #1a2e24; background: #f4faf7; padding: 2rem; border-radius: 10px;">
            <div style="background: white; padding: 2rem; border-radius: 8px; border: 1px solid #d4e8df;">
              <h2 style="color: #1a6b52; margin-bottom: 1.5rem;">جزاكم الله خيراً</h2>
              <p>السيد/ة <strong>${form.name}</strong> المحترم/ة،</p>
              <p>نشكركم على اهتمامكم بالمساهمة في بناء مسجد في منطقة <strong>${plotName}</strong>.</p>
              <p>لقد تم استلام طلبكم والوثائق المرفقة بنجاح. سيقوم فريق دائرة الشؤون الإسلامية بمراجعة الطلب والتواصل معكم في أقرب وقت ممكن لإتمام الإجراءات بإذن الله.</p>
              <p>تفضلوا بقبول فائق التقدير والاحترام،</p>
              <br/>
              <hr style="border: none; border-top: 1px solid #d4e8df; margin: 20px 0;">
              <p style="font-size: 0.85rem; color: #7a9e8c;">هذا بريد تلقائي من منصة بناء المساجد - دائرة الشؤون الإسلامية بالشارقة.</p>
            </div>
          </div>
        `;

        console.log('DEBUG: Sending Email update to:', form.email);
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: form.email,
            subject: `تأكيد استلام طلب بناء مسجد - ${plotName}`,
            html: emailHtml,
          }),
        });
        console.log('Email sent successfully!');
      } catch (emailErr) {
        console.error('Email sending error:', emailErr);
      }


      // Reserve the plot in the database
      await updatePlotAvailability(plotId, false);
      if (onSuccess) onSuccess();

      setSubmitted(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      // Show more specific error message if available
      const detailedError = err.message || err.error_description || 'حدث خطأ غير معروف';
      setError(`خطأ: ${detailedError}. يرجى التأكد من تشغيل ملف SQL وإنشاء مجلد documents في Storage.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3> مهتم ببناء مسجد في هذه المنطقة</h3>
            <p>{plotName}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {submitted ? (
          <div className="success-message">
            <div className="success-icon">
              <img src="/brand-logo-official.png" alt="دائرة الشؤون الإسلامية" style={{ width: '180px', height: 'auto', objectFit: 'contain', marginBottom: '1rem' }} />
            </div>

            <h4>جزاك الله خيراً!</h4>
            <p>تم استلام طلبك بنجاح. سيتم التواصل معك قريبا.</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}
              onClick={onClose}
            >
              حسناً
            </button>
          </div>
        ) : (
          <form className="modal-body" onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: '#fee2e2', color: '#dc2626',
                padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem', fontSize: '0.82rem', fontWeight: 700,
                textAlign: 'center', lineHeight: 1.5
              }}>
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label>الاسم الكامل <span>*</span></label>
              <input
                className="form-input"
                type="text"
                placeholder="محمد أحمد الشريف"
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>رقم الهاتف <span>*</span></label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  background: 'white'
                }}>
                  <span style={{
                    padding: '0 0.8rem',
                    background: '#f8fafc',
                    borderLeft: '1px solid var(--border)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-mid)',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>+971</span>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="50 000 0000"
                    required
                    style={{ border: 'none', width: '100%', height: '40px' }}
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>البريد الإلكتروني <span>*</span></label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="example@email.com"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>صورة الهوية <span>*</span></label>
                <div
                  className={`dropzone ${idDragActive ? 'active' : ''} ${idFile ? 'has-file' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIdDragActive(true); }}
                  onDragLeave={() => setIdDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIdDragActive(false);
                    if (e.dataTransfer.files?.[0]) setIdFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => document.getElementById('id-upload')?.click()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: idDragActive ? 'var(--green-xpale)' : '#f8fafc',
                    transition: 'all 0.2s',
                    borderColor: idFile ? 'var(--green-main)' : (idDragActive ? 'var(--green-main)' : '#cbd5e1')
                  }}
                >
                  <input
                    id="id-upload"
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    onChange={e => setIdFile(e.target.files?.[0] || null)}
                  />
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{idFile ? '✅' : '🆔'}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    {idFile ? idFile.name : 'اسحب صورة الهوية أو اضغط هنا'}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>صورة الجواز</label>
                <div
                  className={`dropzone ${passportDragActive ? 'active' : ''} ${passportFile ? 'has-file' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setPassportDragActive(true); }}
                  onDragLeave={() => setPassportDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setPassportDragActive(false);
                    if (e.dataTransfer.files?.[0]) setPassportFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => document.getElementById('passport-upload')?.click()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: passportDragActive ? 'var(--green-xpale)' : '#f8fafc',
                    transition: 'all 0.2s',
                    borderColor: passportFile ? 'var(--green-main)' : (passportDragActive ? 'var(--green-main)' : '#cbd5e1')
                  }}
                >
                  <input
                    id="passport-upload"
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    onChange={e => setPassportFile(e.target.files?.[0] || null)}
                  />
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{passportFile ? '✅' : '🛂'}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    {passportFile ? passportFile.name : 'اسحب صورة الجواز أو اضغط هنا'}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>رسالة إضافية (اختياري)</label>
              <textarea
                className="form-input form-textarea"
                placeholder="مثال: أريد التبرع باسم المرحوم والدي..."
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                style={{ height: '80px' }}
              />
            </div>

            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? 'جاري الإرسال والرفع...' : '✉️ إرسال الاستفسار والوثائق'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PlotDetail;
