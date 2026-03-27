export const sendWelcomeEmail = async (email: string, name: string, password: string) => {
    // Switching to n8n as requested by the user
    const N8N_URL = import.meta.env.VITE_N8N_EMAIL_WEBHOOK_URL;
    
    if (!N8N_URL) {
        console.warn('Email was not sent because VITE_N8N_EMAIL_WEBHOOK_URL is not set in .env');
        return false;
    }

    try {
        const response = await fetch('/n8n-email-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'WELCOME_EMAIL',
                data: {
                    email,
                    name,
                    password,
                    loginUrl: 'http://localhost:5174/login',
                    sentAt: new Date().toISOString()
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`n8n Webhook Error: ${response.statusText}`);
        }

        console.log('Email data sent to n8n successfully');
        return true;
    } catch (error) {
        console.error('Error sending email via n8n:', error);
        return false;
    }
};
