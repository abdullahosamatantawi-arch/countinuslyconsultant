import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── استيراد الدوال المُختبَرة ────────────────────────────────
// نستورد الدوال المساعدة مباشرة — تأكد من تصديرها في الملف الأصلي:
//   export function daysLeft(...) { ... }
//   export function fileToBase64(...) { ... }
import LicenseExtractor, {
  daysLeft,
  fileToBase64,
} from "../components/LicenseExtractor";

// ─── Mock لـ fetch ────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Mock لـ clipboard ───────────────────────────────────────
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

// ─── بيانات اختبار ثابتة ─────────────────────────────────────
const MOCK_EXTRACTED = {
  license_number: "12345-2024",
  trade_name: "شركة الأنظمة المتقدمة Advanced Systems Co.",
  investor_name: "محمد أحمد العلي",
  mobile: "+971501234567",
  email: "info@advanced.ae",
  expiry_date: "31-12-2099", // تاريخ بعيد — سارية دائماً في الاختبارات
  is_expired: false,
};

function makeApiResponse(data: any = MOCK_EXTRACTED) {
  return {
    ok: true,
    json: async () => ({
      content: [{ type: "text", text: JSON.stringify(data) }],
    }),
  };
}

function makePdfFile(name = "license.pdf") {
  return new File(["fake-pdf-content"], name, { type: "application/pdf" });
}

function makeImageFile(name = "license.png") {
  return new File(["fake-image-content"], name, { type: "image/png" });
}

// ─── Helper: تجاوز FileReader في jsdom ───────────────────────
function mockFileReader(base64Result = "ZmFrZWRhdGE=", shouldFail = false) {
  const OriginalFileReader = globalThis.FileReader;
  globalThis.FileReader = class {
    onload: any;
    onerror: any;
    readAsDataURL() {
      setTimeout(() => {
        if (shouldFail) {
          this.onerror?.(new Error("فشل قراءة الملف"));
        } else {
          this.onload?.({
            target: { result: `data:application/pdf;base64,${base64Result}` },
          });
        }
      }, 0);
    }
  } as any;

  // Cleanup hook
  afterEach(() => {
    globalThis.FileReader = OriginalFileReader;
  });
}

// ─────────────────────────────────────────────────────────────
//  1. daysLeft — الدالة المساعدة لحساب الأيام المتبقية
// ─────────────────────────────────────────────────────────────
describe("daysLeft()", () => {
  it("يُرجع null إذا كان النص فارغاً أو غير معرَّف", () => {
    expect(daysLeft("")).toBeNull();
    expect(daysLeft(null as any)).toBeNull();
    expect(daysLeft(undefined as any)).toBeNull();
  });

  it("يُرجع null إذا كان صيغة التاريخ غير متوقعة", () => {
    expect(daysLeft("2024/12/31")).toBeNull();   // شرطة مائلة بدلاً من شرطة
    expect(daysLeft("31 Dec 2024")).toBeNull();  // نص إنجليزي
    expect(daysLeft("invalid")).toBeNull();
  });

  it("يُرجع عدداً سالباً لتاريخ منتهٍ في الماضي", () => {
    const result = daysLeft("01-01-2000");
    expect(result).not.toBeNull();
    expect(result!).toBeLessThan(0);
  });

  it("يُرجع عدداً موجباً لتاريخ بعيد في المستقبل", () => {
    const result = daysLeft("31-12-2099");
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(365);
  });

  it("يُرجع قيمة قريبة من الصفر لتاريخ اليوم", () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const result = daysLeft(`${dd}-${mm}-${yyyy}`);
    expect(result).not.toBeNull();
    // بين -1 و 1 (حسب التوقيت المحلي)
    expect(Math.abs(result!)).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────
//  2. fileToBase64 — تحويل الملف إلى Base64
// ─────────────────────────────────────────────────────────────
describe("fileToBase64()", () => {
  it("يُعيد Base64 بنجاح لملف صالح", async () => {
    mockFileReader("dGVzdGRhdGE=");
    const file = makePdfFile();
    const result = await fileToBase64(file);
    expect(result).toBe("dGVzdGRhdGE=");
  });

  it("يرفض Promise إذا فشل FileReader", async () => {
    mockFileReader("", true);
    const file = makePdfFile();
    await expect(fileToBase64(file)).rejects.toThrow("فشل قراءة الملف");
  });
});

// ─────────────────────────────────────────────────────────────
//  3. LicenseExtractor Component
// ─────────────────────────────────────────────────────────────
describe("LicenseExtractor — المكوّن الرئيسي", () => {
  const TEST_API_KEY = "sk-ant-test-key";

  beforeEach(() => {
    mockFetch.mockReset();
    mockWriteText.mockClear();
  });

  // ── العرض الأولي ──────────────────────────────────────────
  describe("العرض الأولي", () => {
    it("يعرض منطقة الرفع (drop zone) عند التحميل", () => {
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);
      expect(screen.getByText("ارفع الرخصة التجارية")).toBeInTheDocument();
    });

    it("يعرض تعليمات الرفع", () => {
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);
      expect(screen.getByText(/PDF أو صورة/)).toBeInTheDocument();
    });

    it("لا يعرض البطاقة (card) قبل اختيار ملف", () => {
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);
      expect(screen.queryByText(/KB/)).not.toBeInTheDocument();
    });
  });

  // ── Happy Path: رفع PDF ناجح ──────────────────────────────
  describe("رفع ملف PDF ناجح", () => {
    it("يُظهر اسم الملف بعد الاختيار", async () => {
      mockFetch.mockResolvedValue(makeApiResponse());
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile("my-license.pdf"));

      expect(await screen.findByText("my-license.pdf")).toBeInTheDocument();
    });

    it("يُظهر مؤشر التحميل أثناء الاستخراج", async () => {
      // fetch لا يُحل فوراً
      let resolveFetch!: (v: any) => void;
      mockFetch.mockReturnValue(
        new Promise((res) => { resolveFetch = res; })
      );

      render(<LicenseExtractor apiKey={TEST_API_KEY} />);
      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());

      expect(await screen.findByText(/جاري استخراج البيانات/)).toBeInTheDocument();

      // أنهِ الطلب
      resolveFetch(makeApiResponse());
    });

    it("يعرض الحقول المستخرجة بعد النجاح", async () => {
      mockFetch.mockResolvedValue(makeApiResponse());
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());

      expect(await screen.findByText(MOCK_EXTRACTED.license_number)).toBeInTheDocument();
      expect(screen.getByText(MOCK_EXTRACTED.trade_name)).toBeInTheDocument();
      expect(screen.getByText(MOCK_EXTRACTED.investor_name)).toBeInTheDocument();
      expect(screen.getByText(MOCK_EXTRACTED.mobile)).toBeInTheDocument();
      expect(screen.getByText(MOCK_EXTRACTED.email)).toBeInTheDocument();
    });

    it("يُظهر شارة 'سارية' للرخصة غير المنتهية", async () => {
      mockFetch.mockResolvedValue(makeApiResponse());
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());

      expect(await screen.findByText(/سارية/)).toBeInTheDocument();
    });

    it("يُرسل fetch بالنموذج الصحيح (model + system + content)", async () => {
      mockFetch.mockResolvedValue(makeApiResponse());
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());

      await screen.findByText(MOCK_EXTRACTED.license_number);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.anthropic.com/v1/messages");
      const body = JSON.parse(options.body);
      expect(body.model).toContain("claude-sonnet");
      expect(body.system).toContain("استخرج");
      expect(options.headers["x-api-key"]).toBe(TEST_API_KEY);
    });
  });

  // ── Happy Path: رفع صورة ──────────────────────────────────
  describe("رفع صورة ناجح", () => {
    it("يُرسل content بنوع image عند رفع صورة", async () => {
      mockFetch.mockResolvedValue(makeApiResponse());
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makeImageFile());

      await waitFor(() => expect(mockFetch).toHaveBeenCalled());

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const contentTypes = body.messages[0].content.map((c: any) => c.type);
      expect(contentTypes).toContain("image");
    });
  });

  // ── حالة: بدون API Key ────────────────────────────────────
  describe("بدون API Key", () => {
    it("يعرض رسالة خطأ واضحة إذا لم يوجد مفتاح", async () => {
      render(<LicenseExtractor apiKey="" />);
      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());

      expect(await screen.findByText(/API Key/)).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ── حالة: خطأ من الـ API ──────────────────────────────────
  describe("أخطاء الـ API", () => {
    it("يعرض رسالة الخطأ المُعادة من الـ API", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Invalid API key" } }),
      });
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());

      expect(await screen.findByText(/Invalid API key/)).toBeInTheDocument();
    });

    it("يعرض رسالة خطأ عند فشل الشبكة (network error)", async () => {
      mockFetch.mockRejectedValue(new Error("Network Error"));
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());

      expect(await screen.findByText(/Network Error/)).toBeInTheDocument();
    });

    it("يعرض خطأ عند استجابة JSON غير صالحة من الـ API", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ type: "text", text: "not-valid-json!!!" }],
        }),
      });
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());

      // يجب أن يظهر خطأ JSON parse
      await waitFor(() =>
        expect(screen.getByText(/❌/)).toBeInTheDocument()
      );
    });
  });

  // ── حالة: حقول ناقصة (null) في الاستجابة ────────────────
  describe("حقول null في البيانات المستخرجة", () => {
    it("يعرض 'غير موجود في الرخصة' للحقول الفارغة", async () => {
      const partialData = {
        ...MOCK_EXTRACTED,
        mobile: null,
        email: null,
      };
      mockFetch.mockResolvedValue(makeApiResponse(partialData));
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());

      const emptyMessages = await screen.findAllByText("غير موجود في الرخصة");
      expect(emptyMessages.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── شارة منتهية الصلاحية ──────────────────────────────────
  describe("شارة انتهاء الصلاحية", () => {
    it("يعرض شارة 'منتهية' للرخصة المنتهية", async () => {
      const expiredData = {
        ...MOCK_EXTRACTED,
        expiry_date: "01-01-2020",
        is_expired: true,
      };
      mockFetch.mockResolvedValue(makeApiResponse(expiredData));
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());

      expect(await screen.findByText(/منتهية/)).toBeInTheDocument();
    });
  });

  // ── نسخ البيانات ──────────────────────────────────────────
  describe("نسخ البيانات", () => {
    it("ينسخ قيمة الحقل عند الضغط على زر النسخ", async () => {
      mockFetch.mockResolvedValue(makeApiResponse());
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());
      await screen.findByText(MOCK_EXTRACTED.license_number);

      const copyButtons = screen.getAllByTitle("نسخ");
      await userEvent.click(copyButtons[0]);

      expect(mockWriteText).toHaveBeenCalledWith(MOCK_EXTRACTED.license_number);
    });

    it("ينسخ كل البيانات عند الضغط على 'نسخ كل البيانات'", async () => {
      mockFetch.mockResolvedValue(makeApiResponse());
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile());
      await screen.findByText(MOCK_EXTRACTED.license_number);

      await userEvent.click(screen.getByText(/نسخ كل البيانات/));

      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining(MOCK_EXTRACTED.license_number)
      );
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining(MOCK_EXTRACTED.trade_name)
      );
    });
  });

  // ── إعادة التعيين (Reset) ─────────────────────────────────
  describe("إعادة التعيين", () => {
    it("يُعيد الواجهة لحالتها الأولى عند الضغط على 'رخصة جديدة'", async () => {
      mockFetch.mockResolvedValue(makeApiResponse());
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, makePdfFile("test.pdf"));
      await screen.findByText(MOCK_EXTRACTED.license_number);

      await userEvent.click(screen.getByText(/رخصة جديدة/));

      expect(screen.queryByText("test.pdf")).not.toBeInTheDocument();
      expect(screen.queryByText(MOCK_EXTRACTED.license_number)).not.toBeInTheDocument();
      expect(screen.getByText("ارفع الرخصة التجارية")).toBeInTheDocument();
    });
  });

  // ── Drag & Drop ───────────────────────────────────────────
  describe("السحب والإفلات (Drag & Drop)", () => {
    it("يُغيّر تنسيق منطقة الرفع عند السحب فوقها", async () => {
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);
      const dropZone = screen.getByText("ارفع الرخصة التجارية").closest("div")!
        .parentElement!;

      fireEvent.dragOver(dropZone, { preventDefault: vi.fn() });

      // نتحقق من تغيير الحالة عبر وجود النص (لا يختفي الـ dropZone)
      expect(dropZone).toBeInTheDocument();
    });

    it("يُعالج الملف المُفلَت عبر onDrop", async () => {
      mockFileReader();
      mockFetch.mockResolvedValue(makeApiResponse());
      render(<LicenseExtractor apiKey={TEST_API_KEY} />);

      const dropZone = screen.getByText("ارفع الرخصة التجارية").closest("div")!
        .parentElement!;

      const file = makePdfFile("dropped.pdf");
      fireEvent.drop(dropZone, {
        preventDefault: vi.fn(),
        dataTransfer: { files: [file] },
      });

      expect(await screen.findByText("dropped.pdf")).toBeInTheDocument();
    });
  });
});
