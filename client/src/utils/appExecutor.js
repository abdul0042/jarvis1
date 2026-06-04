const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '';

/**
 * Execute an action on a connected app via the backend proxy
 * @param {Object} app - The app configuration object from LocalStorage
 * @param {Object} action - The action details (method, endpoint, payload)
 * @returns {Promise<Object>} - The API response from the proxy
 */
export async function executeAction(app, action) {
  try {
    // ── Gmail: inject OAuth token from localStorage ──────────────────────────
    const extraHeaders = {};
    const isGmail = app.isGmail || app.baseUrl?.includes('jarvis1-92wq.onrender.com/api/gmail');
    if (isGmail) {
      try {
        const tokens = JSON.parse(localStorage.getItem('jarvis_gmail_tokens') || '{}');
        if (tokens.access_token) {
          extraHeaders['Authorization'] = `Bearer ${tokens.access_token}`;
        }
      } catch {
        console.warn('[appExecutor] Could not read Gmail tokens from localStorage');
      }
    }
    // ── Sheets: inject OAuth token from localStorage ──────────────────────────
    const isSheets = app.isSheets || app.baseUrl?.includes('jarvis1-92wq.onrender.com/api/sheets');
    if (isSheets) {
      try {
        const tokens = JSON.parse(localStorage.getItem('jarvis_sheets_tokens') || '{}');
        if (tokens.access_token) {
          extraHeaders['Authorization'] = `Bearer ${tokens.access_token}`;
        }
      } catch {
        console.warn('[appExecutor] Could not read Sheets tokens from localStorage');
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const response = await fetch(`${BACKEND_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appName:    app.name,
        baseUrl:    app.baseUrl,
        endpoint:   action.endpoint,
        method:     action.method,
        payload:    action.payload,
        apiKey:     isGmail ? '' : app.apiKey,      // don't send api key for Gmail
        authHeader: isGmail ? '' : app.authHeader,
        authPrefix: isGmail ? '' : app.authPrefix,
        headers:    extraHeaders,                   // carries the Bearer token
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[appExecutor] Failed to execute action on app ${app.name}:`, error);
    return {
      status: 500,
      statusText: 'Client-side Proxy Request Error',
      error: error.message
    };
  }
}

/**
 * Test connection to a connected app
 * @param {Object} app - The app configuration details
 * @returns {Promise<boolean>} - Whether the connection succeeded
 */
export async function testConnection(app) {
  try {
    // For general health/test check, try a GET to the base URL or common endpoint
    // If it's a mock API, we can hit it. Let's send a request via the proxy.
    // If it's a weather api, finance api or todo api, we can hit their main lists
    let testEndpoint = '/';
    const nameLower = app.name.toLowerCase();
    
    if (nameLower.includes('todo') || app.baseUrl.includes('mock/todos')) {
      testEndpoint = '/api/mock/todos';
    } else if (nameLower.includes('finance') || nameLower.includes('money') || app.baseUrl.includes('mock/finance')) {
      testEndpoint = '/api/mock/finance';
    } else if (nameLower.includes('weather') || app.baseUrl.includes('mock/weather')) {
      testEndpoint = '/api/mock/weather';
    } else if (nameLower.includes('cipher') || app.baseUrl.includes('external')) {
      testEndpoint = '/workers';
    }

    // Adjust testEndpoint if baseUrl contains it already to avoid duplication
    if (app.baseUrl.includes(testEndpoint)) {
      testEndpoint = '';
    }

    const response = await fetch(`${BACKEND_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appName: app.name,
        baseUrl: app.baseUrl,
        endpoint: testEndpoint,
        method: 'GET',
        apiKey: app.apiKey,
        authHeader: app.authHeader,
        authPrefix: app.authPrefix,
      }),
    });

    if (!response.ok) return false;
    
    const data = await response.json();
    // A successful status code (200-299) from the target app indicates success
    return data.status >= 200 && data.status < 300;
  } catch (error) {
    console.error('Test connection error:', error);
    return false;
  }
}
