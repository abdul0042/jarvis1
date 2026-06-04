const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  const {
    appName,
    baseUrl,
    endpoint,
    method,
    payload,
    headers: clientHeaders,
    apiKey,
    authHeader,
    authPrefix
  } = req.body;

  if (!baseUrl) {
    return res.status(400).json({ error: 'baseUrl is required' });
  }
  if (!method) {
    return res.status(400).json({ error: 'method is required' });
  }

  // Construct request headers
  const headers = { ...clientHeaders };

  // Set Content-Type if not set and payload exists
  if (payload && !headers['content-type'] && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let queryParams = {};

  // If apiKey and authHeader are provided, set the auth header or query params
  if (apiKey && authHeader) {
    if (authHeader.toLowerCase() === 'query' || authHeader.toLowerCase() === 'url') {
      const parts = apiKey.split(':');
      if (parts.length === 2) {
        queryParams.consumer_key = parts[0];
        queryParams.consumer_secret = parts[1];
      } else {
        queryParams.api_key = apiKey;
      }
    } else {
      const headerValue = authPrefix ? `${authPrefix} ${apiKey}` : apiKey;
      headers[authHeader] = headerValue;
    }
  }

  // Construct full URL
  let cleanBaseUrl = baseUrl.trim();
  if (cleanBaseUrl.endsWith('/')) {
    cleanBaseUrl = cleanBaseUrl.slice(0, -1);
  }

  let cleanEndpoint = (endpoint || '').trim();
  if (cleanEndpoint && !cleanEndpoint.startsWith('/')) {
    cleanEndpoint = '/' + cleanEndpoint;
  }

  const fullUrl = `${cleanBaseUrl}${cleanEndpoint}`;

  console.log(`[JARVIS Proxy] Forwarding request: ${method.toUpperCase()} ${fullUrl}`);

  try {
    const axiosConfig = {
      method: method.toLowerCase(),
      url: fullUrl,
      headers: headers,
      params: queryParams,
      timeout: 10000, // 10s timeout
    };

    if (payload && ['post', 'put', 'patch', 'delete'].includes(axiosConfig.method)) {
      axiosConfig.data = payload;
    } else if (payload && axiosConfig.method === 'get') {
      axiosConfig.params = { ...axiosConfig.params, ...payload };
    }

    console.log('[JARVIS Proxy] Query params:', JSON.stringify(queryParams));
    console.log('[JARVIS Proxy] Headers:', JSON.stringify(headers));
    console.log('[JARVIS Proxy] Full URL:', fullUrl);

    const response = await axios(axiosConfig);
    let responseData = response.data;

    const isWoo = appName && appName.toLowerCase().includes('woocommerce');
    const isOrders = endpoint && endpoint.toLowerCase().includes('/orders');

    // Log all response headers for orders endpoints to help debug total-count issues
    if (isOrders && method.toLowerCase() === 'get') {
      console.log(`[JARVIS Proxy] Orders response headers:`, JSON.stringify(response.headers, null, 2));
      if (Array.isArray(responseData)) {
        console.log(`[JARVIS Proxy] Orders array length: ${responseData.length}`);
      } else if (typeof responseData === 'object') {
        const keys = Object.keys(responseData || {});
        console.log(`[JARVIS Proxy] Orders response keys: ${keys.join(', ')}`);
        // Log top-level numeric/count fields
        keys.forEach(k => {
          if (typeof responseData[k] === 'number' || /total|count|pagination|meta/i.test(k)) {
            console.log(`[JARVIS Proxy] Orders field "${k}": ${JSON.stringify(responseData[k])}`);
          }
        });
      }
    }

    // Trim order responses for any app using a WooCommerce-style /orders endpoint
    if (isOrders && method.toLowerCase() === 'get' && Array.isArray(responseData)) {
      responseData = responseData.map(o => ({
        id: o.id,
        number: o.number,
        status: o.status,
        billing: {
          first_name: o.billing?.first_name || '',
          last_name:  o.billing?.last_name  || '',
          email:      o.billing?.email      || ''
        },
        total:        o.total,
        date_created: o.date_created
      }));
    }

    return res.status(response.status).json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: responseData
    });
  } catch (error) {
    console.error(`[JARVIS Proxy] Error:`, error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.status(error.response.status).json({
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        error: error.message
      });
    } else if (error.request) {
      // The request was made but no response was received
      return res.status(504).json({
        status: 504,
        statusText: 'Gateway Timeout',
        error: 'No response received from the connected app API.',
        details: error.message
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({
        status: 500,
        statusText: 'Internal Server Error',
        error: error.message
      });
    }
  }
});

module.exports = router;
