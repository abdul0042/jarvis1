const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:5000/api/gmail/callback'
);

// Step 1 - start OAuth flow
router.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify'
    ]
  });
  res.redirect(url);
});

// Step 2 - Google redirects back here with a code
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { tokens } = await oauth2Client.getToken(code);

    if (state === 'sheets') {
      // Send sheets tokens back
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Google Sheets Connected</title></head>
        <body style="background:#000;color:#00ff41;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px">
          <div style="font-size:22px">✅ Google Sheets Connected!</div>
          <div style="font-size:12px;opacity:0.6">Closing window...</div>
          <script>
            try {
              window.opener.postMessage(${JSON.stringify({ type: 'sheets-tokens', tokens })}, 'http://localhost:5173');
            } catch(e) {}
            setTimeout(() => window.close(), 1000);
          </script>
        </body>
        </html>
      `);
    }

    // Default: Send Gmail tokens back to the opener window via postMessage, then close popup
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Gmail Connected</title></head>
      <body style="background:#000;color:#00ff41;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px">
        <div style="font-size:22px">✅ Gmail Connected!</div>
        <div style="font-size:12px;opacity:0.6">Closing window...</div>
        <script>
          try {
            window.opener.postMessage(${JSON.stringify({ type: 'gmail-tokens', tokens })}, 'http://localhost:5173');
          } catch(e) {}
          setTimeout(() => window.close(), 1000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('[Gmail] OAuth callback error:', error.message);
    res.status(500).send(`
      <html><body style="background:#000;color:#ff3131;font-family:monospace;padding:40px">
        <h3>Gmail Auth Failed</h3><p>${error.message}</p>
        <script>setTimeout(()=>window.close(),3000)</script>
      </body></html>
    `);
  }
});

const { executeGoogleCall } = require('./googleAuthHelper');

// GET /api/gmail/inbox — fetch emails with automatic/silent token refresh
// Query: ?max=10&q=search_query
router.get('/inbox', async (req, res) => {
  try {
    const result = await executeGoogleCall('gmail', req, async (client) => {
      const gmail = google.gmail({ version: 'v1', auth: client });
      const maxResults = parseInt(req.query.max) || 10;
      const q = req.query.q || '';

      const list = await gmail.users.messages.list({ userId: 'me', maxResults, q });
      const messages = list.data.messages || [];

      const detailed = await Promise.all(messages.map(async (msg) => {
        const full = await gmail.users.messages.get({
          userId: 'me', id: msg.id, format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date']
        });
        const headers = full.data.payload.headers.reduce((acc, h) => {
          acc[h.name] = h.value; return acc;
        }, {});
        return {
          id: msg.id,
          from: headers['From'],
          to: headers['To'],
          subject: headers['Subject'],
          date: headers['Date'],
          snippet: full.data.snippet,
        };
      }));

      return { success: true, count: detailed.length, emails: detailed };
    });
    res.json(result);
  } catch (err) {
    console.error('[Gmail] Inbox error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

// POST /api/gmail/send — send an email with automatic/silent token refresh
// Body: { to, subject, body }
router.post('/send', async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, and body are required.' });
  }

  try {
    const result = await executeGoogleCall('gmail', req, async (client) => {
      const gmail = google.gmail({ version: 'v1', auth: client });

      const rawMessage = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        body,
      ].join('\r\n');

      const encoded = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
      return { success: true, message: `Email sent to ${to}` };
    });
    res.json(result);
  } catch (err) {
    console.error('[Gmail] Send error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

// POST /api/gmail/mark-read — mark an email as read with automatic/silent token refresh
// Body: { id }
router.post('/mark-read', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Email id is required.' });

  try {
    const result = await executeGoogleCall('gmail', req, async (client) => {
      const gmail = google.gmail({ version: 'v1', auth: client });

      await gmail.users.messages.modify({
        userId: 'me',
        id: id,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
      return { success: true, message: 'Email marked as read' };
    });
    res.json(result);
  } catch (err) {
    console.error('[Gmail] Mark-read error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

// GET /api/gmail/profile — get user profile (email address) with automatic/silent token refresh
router.get('/profile', async (req, res) => {
  try {
    const result = await executeGoogleCall('gmail', req, async (client) => {
      const gmail = google.gmail({ version: 'v1', auth: client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      return { email: profile.data.emailAddress };
    });
    res.json(result);
  } catch (err) {
    console.error('[Gmail] Profile error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

module.exports = router;
