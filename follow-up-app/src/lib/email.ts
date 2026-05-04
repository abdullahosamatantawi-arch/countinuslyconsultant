/**
 * Centeralized Email Notification System
 * Connects the frontend to n8n workflows for automated communication.
 */

export type NotificationType = 
    | 'WELCOME_EMAIL' 
    | 'PROJECT_STATUS_UPDATE' 
    | 'STAGE_STATUS_UPDATE'
    | 'MODIFICATION_REQUEST';

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

/**
 * Sends a notification payload to the n8n email webhook.
 */
export const sendEmailNotification = async (type: NotificationType, data: NotificationData) => {
    const N8N_URL = import.meta.env.VITE_N8N_EMAIL_WEBHOOK_URL;
    
    if (!N8N_URL) {
        console.warn(`Email notification (${type}) was not sent because VITE_N8N_EMAIL_WEBHOOK_URL is not set.`);
        return false;
    }

    try {
        // Use the relative path for the Vercel/Vite proxy to avoid CORS issues
        const response = await fetch('/n8n-email-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                data: {
                    ...data,
                    loginUrl: data.loginUrl || `${window.location.origin}/login`,
                    sentAt: new Date().toISOString()
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`n8n Webhook Error: ${response.statusText}`);
        }

        console.log(`Notification of type ${type} sent successfully to ${data.email}`);
        return true;
    } catch (error) {
        console.error(`Error sending ${type} via n8n:`, error);
        return false;
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
