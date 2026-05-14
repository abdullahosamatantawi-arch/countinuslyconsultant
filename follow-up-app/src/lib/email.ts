/**
 * Centralized Email Notification System - Powered by Resend
 * Connects the frontend directly to Resend API for high-deliverability emails.
 */

export type NotificationType = 
    | 'WELCOME_EMAIL' 
    | 'PROJECT_STATUS_UPDATE' 
    | 'STAGE_STATUS_UPDATE'
    | 'MODIFICATION_REQUEST'
    | 'WEEKLY_REMINDER'
    | 'PASSWORD_RECOVERY';

interface NotificationData {
    email: string;
    name: string;
    projectName?: string;
    status?: string;
    message?: string;
    password?: string; // For welcome emails
    stageName?: string; // For stage updates
    loginUrl?: string;
}

const getEmailTemplate = (type: NotificationType, data: NotificationData) => {
    const loginUrl = data.loginUrl || `${window.location.origin}/login`;
    
    switch (type) {
        case 'WELCOME_EMAIL':
            return {
                subject: 'مرحباً بك في منصة دائرة الشؤون الإسلامية - بيانات الدخول الخاصة بك',
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #059669;">مرحباً ${data.name}،</h2>
                        <p>تم إنشاء حسابك بنجاح في منصة إدارة مشاريع المساجد. يمكنك الآن الدخول ومتابعة المخططات الهندسية.</p>
                        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 10px; border: 1px solid #bbf7d0; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold;">بيانات الدخول:</p>
                            <p style="margin: 10px 0;"><strong>البريد الإلكتروني:</strong> ${data.email}</p>
                            <p style="margin: 10px 0;"><strong>كلمة المرور المؤقتة:</strong> <span style="color: #059669; font-size: 1.2em; font-weight: bold;">${data.password}</span></p>
                        </div>
                        <p>يرجى النقر على الرابط أدناه لتسجيل الدخول:</p>
                        <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">دخول المنصة</a>
                        <p style="font-size: 0.8em; color: #666; margin-top: 30px;">هذا البريد تم إرساله آلياً، يرجى عدم الرد.</p>
                    </div>
                `
            };
        case 'STAGE_STATUS_UPDATE':
            return {
                subject: `تحديث حالة المشروع: تم اعتماد مرحلة ${data.stageName}`,
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #2563eb;">إشعار اعتماد مرحلة</h2>
                        <p>عزيزي <strong>${data.name}</strong>،</p>
                        <p>نود إعلامك بأنه تم <strong>اعتماد</strong> مرحلة "${data.stageName}" بنجاح في مشروع "${data.projectName}".</p>
                        <p>يمكنك الآن الانتقال للمرحلة التالية من المخططات عبر المنصة.</p>
                        <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">مراجعة المشروع</a>
                    </div>
                `
            };
        case 'WEEKLY_REMINDER':
            return {
                subject: 'تذكير أسبوعي: الإسراع في تنفيذ المخططات الهندسية',
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #d97706;">تذكير دوري بجدول المواعيد</h2>
                        <p>عزيزي <strong>${data.name}</strong>،</p>
                        <p>يرجى العلم بضرورة الإسراع في تنفيذ المخططات الهندسية وتسليمها في الوقت المحدد لضمان سير المشروع بسلاسة.</p>
                        <p style="font-weight: bold; color: #d97706;">ملاحظة الإدارة:</p>
                        <p>${data.message}</p>
                        <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #d97706; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">دخول المنصة</a>
                    </div>
                `
            };
        case 'PASSWORD_RECOVERY':
            return {
                subject: 'استعادة كلمة المرور - منصة دائرة الشؤون الإسلامية',
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #ef4444;">طلب استعادة كلمة المرور</h2>
                        <p>عزيزي <strong>${data.name}</strong>،</p>
                        <p>لقد تلقينا طلباً لاستعادة كلمة المرور الخاصة بحسابك في منصة إدارة مشاريع المساجد.</p>
                        <div style="background-color: #fef2f2; padding: 20px; border-radius: 10px; border: 1px solid #fecaca; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold;">بيانات الحساب الخاصة بك:</p>
                            <p style="margin: 10px 0;"><strong>البريد الإلكتروني:</strong> ${data.email}</p>
                            <p style="margin: 10px 0;"><strong>كلمة المرور الحالية:</strong> <span style="color: #ef4444; font-size: 1.2em; font-weight: bold;">${data.password}</span></p>
                        </div>
                        <p>يمكنك الآن العودة لتسجيل الدخول باستخدام هذه البيانات:</p>
                        <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">تسجيل الدخول الآن</a>
                        <p style="font-size: 0.8em; color: #666; margin-top: 30px;">إذا لم تكن أنت من طلب هذا، يرجى تجاهل هذا البريد الإلكتروني.</p>
                    </div>
                `
            };
        default:
            return {
                subject: 'تنبيه جديد من منصة دائرة الشؤون الإسلامية',
                html: `<div dir="rtl"><h3>إشعار جديد</h3><p>${data.message}</p></div>`
            };
    }
};

/**
 * Sends an email using Resend API.
 */
export const sendEmailNotification = async (type: NotificationType, data: NotificationData): Promise<{success: boolean, error?: string}> => {
    const API_KEY = import.meta.env.VITE_RESEND_API_KEY;
    
    if (!API_KEY) {
        return { success: false, error: 'VITE_RESEND_API_KEY is not set' };
    }

    const { subject, html } = getEmailTemplate(type, data);

    try {
        const response = await fetch('/resend-api/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Islamic Affairs Projects <no-reply@siahr.net>',
                to: [data.email],
                subject: subject,
                html: html,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            // Handle common Resend errors
            const isSandboxError = result.message?.includes('onboarding@resend.dev') || response.status === 403;
            
            if (isSandboxError) {
                console.group('📧 [EMAIL PREVIEW - SANDBOX MODE]');
                console.log('To:', data.email);
                console.log('Subject:', subject);
                console.log('Type:', type);
                console.log('Content:', html);
                console.groupEnd();

                return { 
                    success: false, 
                    error: 'نظراً لأنك في الوضع التجريبي (Resend Sandbox)، تم إرسال محتوى البريد إلى "Console" المتصفح للمعاينة، حيث لا يمكن الإرسال حالياً إلا لبريدك الشخصي المسجل.' 
                };
            }
            return { success: false, error: result.message || response.statusText };
        }

        console.log(`Notification sent via Resend: ${result.id}`);
        return { success: true };
    } catch (error: any) {
        console.error(`Error sending email via Resend:`, error);
        return { success: false, error: error.message || 'Network Error' };
    }
};

/**
 * Backward compatibility wrapper for Welcome Emails
 */
export const sendWelcomeEmail = async (email: string, name: string, password: string) => {
    return sendEmailNotification('WELCOME_EMAIL', {
        email,
        name,
        password
    });
};
