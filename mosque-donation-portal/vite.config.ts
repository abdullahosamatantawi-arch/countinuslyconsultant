// @ts-nocheck
import { defineConfig, loadEnv } from 'vite'

import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'mosque-icon.svg'],
        manifest: {
          name: 'منصة بناء ورعاية المساجد',
          short_name: 'رعاية المساجد',
          description: 'منصة تبرعات لإدارة بناء ورعاية المساجد التابعة لدائرة الشؤون الإسلامية',
          theme_color: '#1a6b52',
          background_color: '#f5faf7',
          display: 'standalone',
          orientation: 'portrait',
          dir: 'rtl',
          lang: 'ar',
          icons: [
            {
              src: 'mosque-icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: 'brand-logo-official.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    server: {
      proxy: {
        '/api/send-sms': {
          target: 'https://api.smscountry.com', // Dummy target required by Vite
          changeOrigin: true,
          rewrite: (path) => '',
          bypass: async (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const { phone, message } = JSON.parse(body);
                  console.log('--- LOCAL SMS PROXY ---');
                  console.log('Phone:', phone);

                  const smsUrl = env.VITE_SMS_COUNTRY_URL || 'https://api.smscountry.com/SMSCwebservice_bulk.aspx';
                  const smsUser = env.VITE_SMS_COUNTRY_USER;
                  const smsPass = env.VITE_SMS_COUNTRY_PASS;
                  const smsSid = env.VITE_SMS_SENDER_ID || 'islamicmc';

                  if (!smsUser || !smsPass) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'SMS credentials missing in .env.local' }));
                    return;
                  }

                  const hasArabic = /[\u0600-\u06FF]/.test(message);
                  let finalMessage = message;
                  let mtype = 'N';

                  if (hasArabic) {
                    finalMessage = message.split('').map(char => {
                      return char.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase();
                    }).join('');
                    mtype = 'OL';
                  }

                  const fullUrl = `${smsUrl}?user=${encodeURIComponent(smsUser)}&passwd=${encodeURIComponent(smsPass)}&message=${finalMessage}&mobilenumber=${encodeURIComponent(phone)}&sid=${encodeURIComponent(smsSid)}&mtype=${mtype}&dr=Y`;

                  const response = await fetch(fullUrl);
                  const responseText = await response.text();
                  console.log('Response:', responseText);

                  const isSuccess = response.ok && (responseText.startsWith('OK') || responseText.includes('success'));

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: isSuccess,
                    statusCode: response.status,
                    response: responseText,
                    local: true
                  }));
                } catch (err) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return true; // Handle request in bypass
            }
          }
        },
        '/api/send-email': {
          target: 'https://api.resend.com',
          changeOrigin: true,
          rewrite: (path) => '',
          bypass: async (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const { to, subject, html } = JSON.parse(body);
                  const apiKey = env.VITE_RESEND_API_KEY;

                  console.log('--- LOCAL EMAIL PROXY ---');
                  console.log('To:', to);
                  console.log('Subject:', subject);

                  if (!apiKey) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'VITE_RESEND_API_KEY missing in .env.local' }));
                    return;
                  }

                  const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${apiKey}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      from: 'Department of Islamic Affairs <no-reply@siahr.net>', // Default Resend test address
                      to,
                      subject,
                      html
                    })
                  });

                  const result = await response.json();
                  console.log('Resend API response:', result);

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: response.ok,
                    data: result
                  }));
                } catch (err) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return true;
            }
          }
        }

      }
    }
  };
})
