exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { region, engineer, plot, progress, work } = body;

        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const MANAGER_EMAIL = process.env.MANAGER_EMAIL;

        if (!RESEND_API_KEY || !MANAGER_EMAIL) {
            console.error("Missing RESEND_API_KEY or MANAGER_EMAIL environment variables.");
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: "Server configuration error: Missing API Key or Manager Email" }) 
            };
        }

        const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #10b981;">تقرير زيارة ميدانية جديد</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; width: 30%;"><strong>المنطقة:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${region || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>اسم المهندس:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${engineer || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>رقم القطعة:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${plot || 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>نسبة الإنجاز:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${progress ? progress + '%' : 'غير محدد'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>الأعمال الجارية:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${work ? work.replace(/\n/g, '<br/>') : 'غير محدد'}</td>
                    </tr>
                </table>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">تم الإرسال من نظام إدارة وبناء المساجد - بوابة الزيارات الميدانية.</p>
            </div>
        `;

        // Using dynamic import for node-fetch to ensure compatibility or relying on Node 18+ native fetch
        let fetchFn = globalThis.fetch;
        if (!fetchFn) {
            const nodeFetch = await import('node-fetch');
            fetchFn = nodeFetch.default;
        }

        const res = await fetchFn("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "onboarding@resend.dev", // Resend default testing domain
                to: MANAGER_EMAIL,
                subject: `تقرير ميداني جديد: قطعة ${plot || ''} - المهندس ${engineer || ''}`,
                html: emailHtml,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Resend API Error:", data);
            return { statusCode: res.status, body: JSON.stringify(data) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Email sent successfully", data }),
        };
    } catch (error) {
        console.error("Serverless Function Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
