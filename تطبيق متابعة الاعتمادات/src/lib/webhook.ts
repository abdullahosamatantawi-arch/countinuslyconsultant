/**
 * Service to handle webhook interactions
 */

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

export async function sendToWebhook(payload: any) {
    console.log('Attempting to send webhook...');
    console.log('Webhook URL Configured:', !!WEBHOOK_URL);

    // Alert for debugging
    if (!WEBHOOK_URL) {
        console.error('Webhook URL is missing in .env');
        return;
    }

    try {
        console.log('Sending payload to proxy /n8n-webhook');
        // Use local proxy to avoid CORS
        const response = await fetch('/n8n-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                source: 'approvals_app',
                ...payload,
            }),
        });

        if (!response.ok) {
            throw new Error(`Webhook failed with status: ${response.status}`);
        }

        console.log('Successfully sent data to webhook');
    } catch (error: any) {
        console.error('Failed to send data to webhook:', error);
        console.error(`Webhook Error: ${error.message}`);
    }
}
