const { google } = require('googleapis');
const { OAuthToken } = require('../models/OAuthToken');

/**
 * Creates and configures an OAuth2 client for Google APIs, checking for expiry and proactively refreshing.
 * @param {string} service - 'gmail' or 'sheets'
 * @param {Object} req - The express request object
 */
async function getGoogleAuthClient(service, req) {
  let tokenDoc = await OAuthToken.findOne({ service });

  let accessToken = tokenDoc ? tokenDoc.access_token : req?.headers?.authorization?.replace('Bearer ', '');
  let refreshToken = tokenDoc ? tokenDoc.refresh_token : '';
  let expiryDate = tokenDoc ? tokenDoc.expiry_date : 0;

  if (!accessToken) {
    throw new Error('No access token available.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'http://localhost:5000/api/gmail/callback'
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate
  });

  // Listen to tokens event for automatic refreshes triggered by Google API internally
  oauth2Client.on('tokens', async (tokens) => {
    try {
      const updateData = {};
      if (tokens.access_token) updateData.access_token = tokens.access_token;
      if (tokens.refresh_token) updateData.refresh_token = tokens.refresh_token;
      if (tokens.expiry_date) updateData.expiry_date = tokens.expiry_date;

      await OAuthToken.findOneAndUpdate(
        { service },
        { $set: updateData },
        { upsert: true }
      );
      console.log(`[Google Auth Helper] Event-based refresh saved new tokens for: ${service}`);
    } catch (err) {
      console.error('[Google Auth Helper] Failed to save refreshed tokens in event listener:', err.message);
    }
  });

  // Proactive refresh: if token is expired or close to expiring (1 min buffer)
  const isExpired = expiryDate && (Date.now() >= expiryDate - 60000);
  if ((isExpired || !accessToken) && refreshToken) {
    console.log(`[Google Auth Helper] Proactive refresh triggered for service: ${service}`);
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      const updateData = {
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date
      };
      if (credentials.refresh_token) {
        updateData.refresh_token = credentials.refresh_token;
      }

      await OAuthToken.findOneAndUpdate(
        { service },
        { $set: updateData },
        { upsert: true }
      );

      oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken,
        expiry_date: credentials.expiry_date
      });
      console.log(`[Google Auth Helper] Proactive refresh succeeded for: ${service}`);
    } catch (refreshErr) {
      console.error(`[Google Auth Helper] Proactive refresh failed for ${service}:`, refreshErr.message);
    }
  }

  return oauth2Client;
}

/**
 * Wraps a Google API call with error catching, automatic token refreshing, and silent retry on 401.
 * @param {string} service - 'gmail' or 'sheets'
 * @param {Object} req - The express request object
 * @param {Function} apiCallFn - The API execution callback
 */
async function executeGoogleCall(service, req, apiCallFn) {
  const client = await getGoogleAuthClient(service, req);
  try {
    return await apiCallFn(client);
  } catch (err) {
    const isAuthErr =
      err.status === 401 ||
      err.code === 401 ||
      err.message?.includes('401') ||
      err.message?.includes('invalid_grant') ||
      err.message?.includes('credentials');

    if (isAuthErr) {
      console.log(`[Google Auth Helper] Call failed with auth error (401), attempting manual refresh and retry...`);
      try {
        const tokenDoc = await OAuthToken.findOne({ service });
        if (tokenDoc && tokenDoc.refresh_token) {
          const { credentials } = await client.refreshAccessToken();

          const updateData = {
            access_token: credentials.access_token,
            expiry_date: credentials.expiry_date
          };
          if (credentials.refresh_token) {
            updateData.refresh_token = credentials.refresh_token;
          }

          await OAuthToken.findOneAndUpdate(
            { service },
            { $set: updateData },
            { upsert: true }
          );

          client.setCredentials({
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token || tokenDoc.refresh_token,
            expiry_date: credentials.expiry_date
          });

          console.log(`[Google Auth Helper] Refresh succeeded, retrying API call...`);
          return await apiCallFn(client);
        }
      } catch (retryErr) {
        console.error(`[Google Auth Helper] Retry refresh or call failed:`, retryErr.message);
        throw retryErr;
      }
    }
    throw err;
  }
}

module.exports = {
  getGoogleAuthClient,
  executeGoogleCall
};
