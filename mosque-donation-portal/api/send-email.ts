// @ts-nocheck
export default async function handler(req, res) {
  console.log('=== Email API Handler Started ===');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  if (!apiKey) {
    console.error('CRITICAL: RESEND_API_KEY missing');
    return res.status(500).json({ error: 'RESEND_API_KEY missing in environment' });
  }

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields (to, subject, html)' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Department of Islamic Affairs <no-reply@siahr.net>', 
        to,
        subject,
        html
      })
    });

    const result = await response.json();
    console.log('Resend API response:', result);

    return res.status(response.status).json({
      success: response.ok,
      data: result
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
