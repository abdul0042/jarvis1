const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:5000/api/gmail/callback'
);

// Step 1 - start OAuth flow for Sheets
router.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state: 'sheets',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ]
  });
  res.redirect(url);
});

// Step 2 - Callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);

    res.send(`
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
  } catch (error) {
    console.error('[Sheets] OAuth callback error:', error.message);
    res.status(500).send(`
      <html><body style="background:#000;color:#ff3131;font-family:monospace;padding:40px">
        <h3>Google Sheets Auth Failed</h3><p>${error.message}</p>
        <script>setTimeout(()=>window.close(),3000)</script>
      </body></html>
    `);
  }
});

const { executeGoogleCall } = require('./googleAuthHelper');

// GET /api/sheets/spreadsheets/:spreadsheetId - fetch spreadsheet metadata/structure
router.get('/spreadsheets/:spreadsheetId', async (req, res) => {
  const { spreadsheetId } = req.params;

  try {
    const result = await executeGoogleCall('sheets', req, async (client) => {
      const sheets = google.sheets({ version: 'v4', auth: client });
      const response = await sheets.spreadsheets.get({ spreadsheetId });
      return { success: true, properties: response.data.properties, sheets: response.data.sheets };
    });
    res.json(result);
  } catch (err) {
    console.error('[Sheets] Get spreadsheet error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

// GET /api/sheets/values - get values from spreadsheet range
// Query: ?spreadsheetId=id&range=Sheet1!A1:D100
router.get('/values', async (req, res) => {
  const { spreadsheetId, range } = req.query;
  if (!spreadsheetId || !range) {
    return res.status(400).json({ error: 'spreadsheetId and range are required query parameters.' });
  }

  try {
    const result = await executeGoogleCall('sheets', req, async (client) => {
      const sheets = google.sheets({ version: 'v4', auth: client });
      const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      return { success: true, values: response.data.values || [] };
    });
    res.json(result);
  } catch (err) {
    console.error('[Sheets] Get values error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

// POST /api/sheets/values/append - append rows to spreadsheet range
// Body: { spreadsheetId, range, values: [[val1, val2, ...]] }
router.post('/values/append', async (req, res) => {
  const { spreadsheetId, range, values } = req.body;
  if (!spreadsheetId || !range || !values) {
    return res.status(400).json({ error: 'spreadsheetId, range, and values array are required.' });
  }

  try {
    const result = await executeGoogleCall('sheets', req, async (client) => {
      const sheets = google.sheets({ version: 'v4', auth: client });
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values }
      });
      return { success: true, updatedCells: response.data.updates?.updatedCells, message: 'Values appended successfully.' };
    });
    res.json(result);
  } catch (err) {
    console.error('[Sheets] Append values error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

// PUT /api/sheets/values/update - update values of spreadsheet range
// Body: { spreadsheetId, range, values: [[val1, val2, ...]] }
router.put('/values/update', async (req, res) => {
  const { spreadsheetId, range, values } = req.body;
  if (!spreadsheetId || !range || !values) {
    return res.status(400).json({ error: 'spreadsheetId, range, and values array are required.' });
  }

  try {
    const result = await executeGoogleCall('sheets', req, async (client) => {
      const sheets = google.sheets({ version: 'v4', auth: client });
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
      return { success: true, updatedCells: response.data.updatedCells, message: 'Values updated successfully.' };
    });
    res.json(result);
  } catch (err) {
    console.error('[Sheets] Update values error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

// POST /api/sheets/create - create a new spreadsheet
// Body: { title }
router.post('/create', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Spreadsheet title is required.' });

  try {
    const result = await executeGoogleCall('sheets', req, async (client) => {
      const sheets = google.sheets({ version: 'v4', auth: client });
      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title }
        }
      });
      return {
        success: true,
        spreadsheetId: response.data.spreadsheetId,
        spreadsheetUrl: response.data.spreadsheetUrl,
        title: response.data.properties.title
      };
    });
    res.json(result);
  } catch (err) {
    console.error('[Sheets] Create spreadsheet error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

// POST /api/sheets/append - append rows to spreadsheet
// Body: { spreadsheetId, range, values }
router.post('/append', async (req, res) => {
  const { spreadsheetId, range, values } = req.body;
  if (!spreadsheetId || !range || !values) {
    return res.status(400).json({ error: 'spreadsheetId, range, and values are required.' });
  }

  try {
    const result = await executeGoogleCall('sheets', req, async (client) => {
      const sheets = google.sheets({ version: 'v4', auth: client });
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values }
      });
      return { success: true, updatedCells: response.data.updates?.updatedCells };
    });
    res.json(result);
  } catch (err) {
    console.error('[Sheets] Append error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

// GET /api/sheets/read - read spreadsheet data
// Query or Body: { spreadsheetId, range }
router.get('/read', async (req, res) => {
  const spreadsheetId = req.query.spreadsheetId || req.body.spreadsheetId;
  const range = req.query.range || req.body.range;

  if (!spreadsheetId || !range) {
    return res.status(400).json({ error: 'spreadsheetId and range are required.' });
  }

  try {
    const result = await executeGoogleCall('sheets', req, async (client) => {
      const sheets = google.sheets({ version: 'v4', auth: client });
      const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      return { success: true, values: response.data.values || [] };
    });
    res.json(result);
  } catch (err) {
    console.error('[Sheets] Read error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

// POST /api/sheets/woo-report - create spreadsheet and write WooCommerce orders to it in one go
// Body: { orders: [...], title: "Report title" }
router.post('/woo-report', async (req, res) => {
  const { orders, title } = req.body;
  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ error: 'orders array is required.' });
  }

  try {
    const result = await executeGoogleCall('sheets', req, async (client) => {
      const sheets = google.sheets({ version: 'v4', auth: client });

      // 1. Format orders into rows
      const headers = ['Order ID', 'Status', 'Customer Name', 'Customer Email', 'Total Amount', 'Created At'];
      const rows = [headers];

      orders.forEach(o => {
        const orderId = o.id || o.number || '';
        const status = o.status || '';
        const name = `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim() || 'Guest Customer';
        const email = o.billing?.email || '';
        const total = o.total || '';
        const createdAt = o.date_created || '';
        rows.push([orderId, status, name, email, total, createdAt]);
      });

      // 2. Create new spreadsheet
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title: title || 'WooCommerce Weekly Report' }
        }
      });

      const spreadsheetId = createResponse.data.spreadsheetId;
      const spreadsheetUrl = createResponse.data.spreadsheetUrl;
      const sheetId = createResponse.data.sheets?.[0]?.properties?.sheetId ?? 0;

      // 3. Append all rows to Sheet1
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: rows }
      });

      // 4. Format spreadsheet to be premium/beautiful
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              // Freeze the header row
              {
                updateSheetProperties: {
                  properties: {
                    sheetId,
                    gridProperties: {
                      frozenRowCount: 1
                    }
                  },
                  fields: 'gridProperties.frozenRowCount'
                }
              },
              // Alternating banding colors (Zebra stripes)
              {
                addBanding: {
                  bandedRange: {
                    range: {
                      sheetId,
                      startRowIndex: 0,
                      endRowIndex: rows.length,
                      startColumnIndex: 0,
                      endColumnIndex: 6
                    },
                    rowProperties: {
                      headerColor: { red: 5/255, green: 15/255, blue: 5/255 }, // Dark charcoal/green
                      firstBandColor: { red: 1.0, green: 1.0, blue: 1.0 },
                      secondBandColor: { red: 240/255, green: 245/255, blue: 240/255 } // very light green-tinted white
                    }
                  }
                }
              },
              // Format header text properties (Courier New, bold, matrix-green text, center alignment)
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: 6
                  },
                  cell: {
                    userEnteredFormat: {
                      textFormat: {
                        foregroundColor: { red: 0.0, green: 1.0, blue: 65 / 255 }, // Matrix green #00ff41
                        fontFamily: 'Courier New',
                        fontSize: 10,
                        bold: true
                      },
                      horizontalAlignment: 'CENTER',
                      verticalAlignment: 'MIDDLE'
                    }
                  },
                  fields: 'userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)'
                }
              },
              // Format data cells text properties (Courier New, vertical middle alignment)
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: 1,
                    endRowIndex: rows.length,
                    startColumnIndex: 0,
                    endColumnIndex: 6
                  },
                  cell: {
                    userEnteredFormat: {
                      textFormat: {
                        foregroundColor: { red: 0.05, green: 0.15, blue: 0.05 },
                        fontFamily: 'Courier New',
                        fontSize: 9
                      },
                      verticalAlignment: 'MIDDLE'
                    }
                  },
                  fields: 'userEnteredFormat(textFormat,verticalAlignment)'
                }
              },
              // Auto-resize columns
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: 6
                  }
                }
              }
            ]
          }
        });
      } catch (fmtErr) {
        console.warn('[Sheets] Failed to format WooCommerce report:', fmtErr.message);
      }

      return {
        success: true,
        spreadsheetId,
        spreadsheetUrl,
        title: title || 'WooCommerce Weekly Report',
        message: 'WooCommerce orders report successfully generated!'
      };
    });
    res.json(result);
  } catch (err) {
    console.error('[Sheets] WooCommerce report generator error:', err.message);
    res.status(err.status || err.code || 500).json({ error: err.message });
  }
});

module.exports = router;
