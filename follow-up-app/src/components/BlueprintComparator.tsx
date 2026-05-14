import { useState, useRef } from "react";

// ============================================================
//  BlueprintComparator — Antigravity
//  مقارنة المخططات المعمارية باستخدام Claude AI
//
//  VITE_ANTHROPIC_API_KEY=sk-ant-... في ملف .env
// ============================================================

const API_KEY = (import.meta.env as any)?.VITE_ANTHROPIC_API_KEY || "";

const SYSTEM_PROMPT = `أنت مهندس معماري خبير متخصص في مراجعة المخططات الهندسية.
سيتم إرسال مخططين إليك: الأصلي والمعدّل.
قارن بينهما بدقة واستخرج التغييرات.

أعد JSON فقط بدون أي نص إضافي أو backticks بهذا الشكل الحرفي:
{
  "summary": "ملخص عام للتغييرات في جملتين",
  "stats": {
    "added": 0,
    "removed": 0,
    "modified": 0
  },
  "changes": [
    {
      "type": "added",
      "category": "الفئة (مثل: غرفة، باب، نافذة، قياس، ملاحظة)",
      "description": "وصف التغيير بوضوح",
      "impact": "high أو medium أو low"
    }
  ],
  "recommendations": ["توصية 1", "توصية 2"]
}
نوع التغيير يكون: added أو removed أو modified
إذا لم تستطع تحديد شيء بدقة اذكر ذلك في الوصف.`;

// ── helpers ──────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]);
    r.onerror = () => rej(new Error("فشل قراءة الملف"));
    r.readAsDataURL(file);
  });
}

function getMime(file: File) {
  return file.type || "image/jpeg";
}

function buildContent(b64: string, mime: string, label: string) {
  const block =
    mime === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: mime, data: b64 } }
      : { type: "image", source: { type: "base64", media_type: mime, data: b64 } };
  return [
    { type: "text", text: `### ${label}` },
    block,
  ];
}

const TYPE_META: Record<string, any> = {
  added:    { label: "مضاف",   color: "#16a34a", bg: "#dcfce7", icon: "＋" },
  removed:  { label: "محذوف",  color: "#dc2626", bg: "#fee2e2", icon: "－" },
  modified: { label: "معدّل",  color: "#d97706", bg: "#fef3c7", icon: "✎"  },
};

const IMPACT_META: Record<string, any> = {
  high:   { label: "عالي",   color: "#dc2626" },
  medium: { label: "متوسط",  color: "#d97706" },
  low:    { label: "منخفض",  color: "#64748b" },
};

interface Change {
  type: 'added' | 'removed' | 'modified';
  category: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface AnalysisResult {
  summary: string;
  stats: {
    added: number;
    removed: number;
    modified: number;
  };
  changes: Change[];
  recommendations: string[];
}

// ── Upload Box ────────────────────────────────────────────────
function UploadBox({ label, sublabel, file, onFile, color }: { label: string, sublabel: string, file: File | string | null, onFile: (f: File) => void, color: string }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  function handle(f: File | undefined) { if (f) onFile(f); }

  const fileName = file instanceof File ? file.name : typeof file === 'string' ? "مخطط من السحابة" : null;
  const fileSize = file instanceof File ? (file.size / 1024).toFixed(1) + " KB" : "";

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      style={{
        flex: 1,
        border: `2px dashed ${drag ? color : "#cbd5e1"}`,
        borderRadius: 16,
        padding: "1.5rem 1rem",
        textAlign: "center" as const,
        cursor: "pointer",
        background: drag ? `${color}11` : file ? `${color}08` : "#f8fafc",
        transition: "all .2s",
        minHeight: 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <input ref={ref} type="file" accept=".pdf,image/*"
        style={{ display: "none" }}
        onChange={(e) => handle(e.target.files?.[0])} />

      {file ? (
        <>
          <div style={{ fontSize: 32 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 13, color }}>تم الرفع</div>
          <div style={{ fontSize: 12, color: "#64748b", maxWidth: 160,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fileName}
          </div>
          {fileSize && <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {fileSize}
          </div>}
        </>
      ) : (
        <>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: `${color}22`, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>📐</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{label}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{sublabel}</div>
          <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4 }}>
            PDF أو صورة · اسحب وأفلت
          </div>
        </>
      )}
    </div>
  );
}

// ── Change Card ───────────────────────────────────────────────
function ChangeCard({ change, index }: { change: Change, index: number }) {
  const t = TYPE_META[change.type] || TYPE_META.modified;
  const imp = IMPACT_META[change.impact] || IMPACT_META.low;

  return (
    <div style={{
      display: "flex", gap: 12, padding: "12px 14px",
      background: "#fff", borderRadius: 12,
      border: "1px solid #f1f5f9",
      borderRight: `4px solid ${t.color}`,
      animation: `fadeUp .3s ease ${index * 0.06}s both`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: t.bg, color: t.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700, flexShrink: 0,
      }}>{t.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 20,
            background: t.bg, color: t.color, fontWeight: 600,
          }}>{t.label}</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{change.category}</span>
          <span style={{ marginRight: "auto", fontSize: 11, color: imp.color, fontWeight: 600 }}>
            تأثير {imp.label}
          </span>
        </div>
        <div style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.6 }}>
          {change.description}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function BlueprintComparator({ 
  apiKey, 
  initialOriginalUrl, 
  initialRevisedUrl 
}: { 
  apiKey?: string;
  initialOriginalUrl?: string;
  initialRevisedUrl?: string;
}) {
  const key = apiKey || API_KEY;

  const [original,  setOriginal]  = useState<File | string | null>(initialOriginalUrl || null);
  const [revised,   setRevised]   = useState<File | string | null>(initialRevisedUrl || null);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<AnalysisResult | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  async function compare() {
    if (!original || !revised) return;
    if (!key) { setError("لم يتم تعيين API Key."); return; }

    setLoading(true); setError(null); setResult(null);

    try {
      const getB64 = async (item: File | string) => {
        if (typeof item === 'string') {
          const res = await fetch(item);
          const blob = await res.blob();
          const file = new File([blob], "drawing.pdf", { type: blob.type });
          return { b64: await fileToBase64(file), mime: getMime(file) };
        } else {
          return { b64: await fileToBase64(item), mime: getMime(item) };
        }
      };

      const [origInfo, revInfo] = await Promise.all([
        getB64(original),
        getB64(revised),
      ]);

      const content = [
        ...buildContent(origInfo.b64, origInfo.mime, "المخطط الأصلي"),
        ...buildContent(revInfo.b64,  revInfo.mime,  "المخطط المعدّل"),
        { type: "text" as const, text: "قارن بين المخطط الأصلي والمعدّل واستخرج كل التغييرات." },
      ];

      const res = await fetch("/anthropic-api/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "anthropic-beta": "pdfs-2024-09-25"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "API error");

      const text   = json.content?.map((i: any) => i.text || "").join("");
      // Clean potential markdown blocks
      const cleanJson = text.replace(/```json|```/g, "").trim();
      // Extract first JSON object if there's extra text
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      const finalJson = jsonMatch ? jsonMatch[0] : cleanJson;
      
      const parsed = JSON.parse(finalJson);
      setResult(parsed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const canCompare = original && revised && !loading;

  const filteredChanges = result?.changes?.filter(
    (c) => activeTab === "all" || c.type === activeTab
  ) || [];

  const tabs = [
    { id: "all",      label: "الكل",    count: result?.changes?.length },
    { id: "added",    label: "مضاف",    count: result?.stats?.added },
    { id: "removed",  label: "محذوف",   count: result?.stats?.removed },
    { id: "modified", label: "معدّل",   count: result?.stats?.modified },
  ];

  return (
    <div style={{
      fontFamily: "'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      direction: "rtl", maxWidth: 680, margin: "0 auto",
      padding: "2rem 1rem", color: "#1a1a1a",
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 42, height: 42, background: "#0f172a",
          borderRadius: 12, display: "flex", alignItems: "center",
          justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13,
        }}>AG</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>مقارنة المخططات</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            يكتشف التغييرات بين المخطط الأصلي والمعدّل تلقائياً
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <UploadBox
          label="المخطط الأصلي"
          sublabel="قبل التعديل"
          file={original}
          onFile={setOriginal}
          color="#3b82f6"
        />
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: "#cbd5e1", flexShrink: 0,
        }}>⇄</div>
        <UploadBox
          label="المخطط المعدّل"
          sublabel="بعد التعديل"
          file={revised}
          onFile={setRevised}
          color="#8b5cf6"
        />
      </div>

      {/* Compare Button */}
      <button
        onClick={compare}
        disabled={!canCompare}
        style={{
          width: "100%", padding: "12px 0", borderRadius: 12,
          border: "none", cursor: canCompare ? "pointer" : "not-allowed",
          background: canCompare ? "#0f172a" : "#e2e8f0",
          color: canCompare ? "#fff" : "#94a3b8",
          fontSize: 15, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all .2s", marginBottom: 20,
        }}
      >
        {loading ? (
          <>
            <span style={{
              width: 16, height: 16, borderRadius: "50%",
              border: "2px solid #ffffff44", borderTopColor: "#fff",
              display: "inline-block", animation: "spin .8s linear infinite",
            }} />
            جاري تحليل المخططين...
          </>
        ) : (
          <>🔍 قارن المخططين</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5",
          borderRadius: 10, padding: "12px 14px",
          color: "#b91c1c", fontSize: 13, marginBottom: 16,
        }}>
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ animation: "fadeUp .4s ease both" }}>

          {/* Summary */}
          <div style={{
            background: "#f8fafc", border: "1px solid #e2e8f0",
            borderRadius: 14, padding: "1.25rem", marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>
              ملخص التغييرات
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#1a1a1a", marginBottom: 14 }}>
              {result.summary}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "مضاف",   val: result.stats?.added,    color: "#16a34a", bg: "#dcfce7" },
                { label: "محذوف",  val: result.stats?.removed,  color: "#dc2626", bg: "#fee2e2" },
                { label: "معدّل",  val: result.stats?.modified, color: "#d97706", bg: "#fef3c7" },
              ].map((s) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: "center", padding: "10px 8px",
                  background: s.bg, borderRadius: 10,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val ?? 0}</div>
                  <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: "6px 14px", borderRadius: 20, border: "none",
                cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: activeTab === t.id ? "#0f172a" : "#f1f5f9",
                color: activeTab === t.id ? "#fff" : "#64748b",
                transition: "all .15s",
              }}>
                {t.label}
                {t.count != null && (
                  <span style={{
                    marginRight: 6, background: activeTab === t.id ? "#ffffff33" : "#e2e8f0",
                    borderRadius: 10, padding: "1px 7px", fontSize: 11,
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Changes List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {filteredChanges.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem", fontSize: 13 }}>
                لا توجد تغييرات في هذه الفئة
              </div>
            ) : (
              filteredChanges.map((c, i) => (
                <ChangeCard key={i} change={c} index={i} />
              ))
            )}
          </div>

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div style={{
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 14, padding: "1.25rem",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8", marginBottom: 10 }}>
                💡 توصيات
              </div>
              <ul style={{ margin: 0, padding: "0 1.2rem", display: "flex", flexDirection: "column", gap: 6 }}>
                {result.recommendations.map((r, i) => (
                  <li key={i} style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.6 }}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
