// @ts-nocheck
export default async function handler(req, res) {
  console.log('=== SMS API Handler Started ===');
  console.log('Request method:', req.method);
  
  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, message } = req.body;

  if (!phone || !message) {
    console.error('Missing phone or message');
    return res.status(400).json({ error: 'Phone and message are required' });
  }

  // Robust environment variable selection
  const smsUrl = process.env.SMS_COUNTRY_URL || process.env.VITE_SMS_COUNTRY_URL || 'https://api.smscountry.com/SMSCwebservice_bulk.aspx';
  const smsUser = process.env.SMS_COUNTRY_USER || process.env.VITE_SMS_COUNTRY_USER;
  const smsPass = process.env.SMS_COUNTRY_PASS || process.env.VITE_SMS_COUNTRY_PASS;
  const smsSid = process.env.SMS_SENDER_ID || process.env.VITE_SMS_SENDER_ID || 'islamicmc';

  const mask = (str) => str ? str.substring(0, 2) + '***' + str.substring(str.length - 2) : 'NONE';

  console.log('Environment variables check:');
  console.log('- SMS_COUNTRY_URL:', smsUrl ? 'SET' : 'NOT SET');
  console.log('- SMS_COUNTRY_USER:', mask(smsUser));
  console.log('- SMS_COUNTRY_PASS:', mask(smsPass));
  console.log('- SMS_SENDER_ID (SID):', smsSid);

  if (!smsUser || !smsPass) {
    console.error('CRITICAL: SMS credentials missing (USER or PASS)');
    return res.status(500).json({ 
      error: 'SMS configuration missing in environment',
      debug: { user: !!smsUser, pass: !!smsPass }
    });
  }

  // Detect if message has Arabic characters
  const hasArabic = /[\u0600-\u06FF]/.test(message);
  let finalMessage = message;
  let mtype = 'N';

  if (hasArabic) {
    console.log('Arabic characters detected. Converting to Unicode Hex...');
    // SMS Country Bulk API requires Unicode Hex for Arabic with mtype=OL
    finalMessage = message.split('').map(char => {
      return char.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase();
    }).join('');
    mtype = 'OL';
  }

  const cleanSmsUrl = smsUrl.trim();
  const fullUrl = `${cleanSmsUrl}?user=${encodeURIComponent(smsUser)}&passwd=${encodeURIComponent(smsPass)}&message=${finalMessage}&mobilenumber=${encodeURIComponent(phone)}&sid=${encodeURIComponent(smsSid)}&mtype=${mtype}&dr=Y`;

  console.log('Making request to SMS Country API...');
  console.log('Target URL:', cleanSmsUrl);
  console.log('Phone:', phone);
  console.log('MType:', mtype);

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain,text/html,application/json',
        'User-Agent': 'VercelServerless/1.1',
      },
    });

    const responseText = await response.text();
    console.log('SMS API response status:', response.status);
    console.log('SMS API response body:', responseText);

    // SMS Country usually returns something like "OK: 12345678" on success
    const isSuccess = response.ok && (responseText.startsWith('OK') || responseText.includes('success'));

    return res.status(200).json({
      success: isSuccess,
      statusCode: response.status,
      response: responseText,
      debug: {
        mtype,
        hasArabic,
      }
    });
  } catch (error) {
    console.error('SMS sending failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
