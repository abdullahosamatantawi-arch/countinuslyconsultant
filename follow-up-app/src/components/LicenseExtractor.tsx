import React, { useState } from "react";
import { UploadCloud, AlertCircle, Loader2, Copy, FileText, Image as ImageIcon, RefreshCcw } from "lucide-react";

export function daysLeft(dateStr?: string | null): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const targetDate = new Date(`${y}-${m}-${d}`);
  if (isNaN(targetDate.getTime())) return null;
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

export interface LicenseData {
  license_number: string | null;
  trade_name: string | null;
  investor_name: string | null;
  mobile: string | null;
  email: string | null;
  expiry_date: string | null;
  is_expired: boolean;
}

interface LicenseExtractorProps {
  apiKey: string;
  onExtractSuccess?: (data: LicenseData) => void;
}

export default function LicenseExtractor({ apiKey, onExtractSuccess }: LicenseExtractorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LicenseData | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setData(null);

    if (!apiKey) {
      setError("Please provide an API Key.");
      return;
    }

    setIsLoading(true);

    try {
      const base64Data = await fileToBase64(selectedFile);
      const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");
      const mediaType = isPdf ? "application/pdf" : (selectedFile.type || "image/jpeg");

      const response = await fetch("/anthropic-api/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "pdfs-2024-09-25",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system: "أنت مساعد ذكي متخصص في استخراج البيانات من الرخص التجارية. استخرج البيانات التالية باللغة العربية (خاصة الاسم التجاري واسم المستثمر) بتنسيق JSON خام (بدون أي نص شرح أو علامات markdown). الحقول المطلوبة: license_number, trade_name (الاسم بالعربي), investor_name (الاسم بالعربي), mobile, email, expiry_date (بصيغة DD-MM-YYYY), is_expired (boolean). إذا لم تجد حقلاً، ضعه null.",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: isPdf ? "document" : "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Data,
                  },
                },
                {
                  type: "text",
                  text: "استخرج البيانات من هذه الرخصة.",
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = `API Error ${response.status}`;
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.error?.message || JSON.stringify(errData.error) || errText;
        } catch {
          errMsg = errText || errMsg;
        }
        throw new Error(errMsg);
      }

      const responseData = await response.json();
      const contentText = responseData.content[0].text;
      
      let parsedData: LicenseData;
      try {
        // Extract JSON from potential markdown code blocks or extra text
        const jsonMatch = contentText.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : contentText;
        parsedData = JSON.parse(cleanJson);
      } catch (parseError) {
        throw new Error("❌ فشل في تحليل البيانات المستخرجة. يرجى المحاولة مرة أخرى أو التأكد من جودة الملف.");
      }

      setData(parsedData);
      if (onExtractSuccess) {
        onExtractSuccess(parsedData);
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string | null) => {
    if (text) navigator.clipboard.writeText(text);
  };

  const handleCopyAll = () => {
    if (data) {
      const allText = `
رقم الرخصة: ${data.license_number}
الاسم التجاري: ${data.trade_name}
اسم المستثمر: ${data.investor_name}
رقم الهاتف: ${data.mobile}
البريد الإلكتروني: ${data.email}
      `.trim();
      navigator.clipboard.writeText(allText);
    }
  };

  const reset = () => {
    setFile(null);
    setData(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-900 font-bold">جاري استخراج البيانات ذكياً...</p>
      </div>
    );
  }

  if (data && file) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800">بيانات الرخصة المستخرجة</h3>
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-bold">
            <RefreshCcw className="w-4 h-4" /> رخصة جديدة
          </button>
        </div>

        <div className="mb-4 p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
          {file.type.includes("pdf") ? <FileText className="w-8 h-8 text-red-500" /> : <ImageIcon className="w-8 h-8 text-blue-500" />}
          <div>
            <p className="font-bold text-slate-700">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: "رقم الرخصة", value: data.license_number },
            { label: "الاسم التجاري", value: data.trade_name },
            { label: "اسم المستثمر", value: data.investor_name },
            { label: "رقم الهاتف", value: data.mobile },
            { label: "البريد الإلكتروني", value: data.email },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-slate-50">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                <p className="font-bold text-slate-800 mt-1">{item.value || "غير موجود في الرخصة"}</p>
              </div>
              {item.value && (
                <button onClick={() => handleCopy(item.value)} title="نسخ" className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <div className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-slate-50">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">حالة الرخصة</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-bold text-slate-800">{data.expiry_date || "غير موجود في الرخصة"}</p>
                {data.is_expired ? (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">منتهية</span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full">سارية</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleCopyAll} className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-all">
          <Copy className="w-4 h-4" /> نسخ كل البيانات
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-bold leading-relaxed">{error}</p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full border-2 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragging ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30"
        }`}
      >
        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,image/*" onChange={handleFileSelect} />
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <UploadCloud className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">ارفع الرخصة التجارية</h3>
        <p className="text-sm font-bold text-slate-400">PDF أو صورة (JPG, PNG)</p>
      </div>
    </div>
  );
}
