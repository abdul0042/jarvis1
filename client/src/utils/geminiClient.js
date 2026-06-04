const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '';

/**
 * Send a message to the backend Gemini chat API
 * @param {string} message - The user's input/command
 * @param {Array} history - Array of previous chat messages
 * @param {Array} connectedApps - Array of connected apps (without sensitive keys)
 * @returns {Promise<Object>} - The JSON response from Gemini
 */
export async function sendChatMessage(message, history, connectedApps, language = 'english', salutation = 'Sir', isSummary = false) {
  try {
    // Sanitize connected apps (remove API keys to keep them secure)
    const sanitizedApps = (connectedApps || []).map(app => ({
      name: app.name,
      baseUrl: app.baseUrl,
      description: app.description
    }));

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        connectedApps: sanitizedApps,
        language,
        salutation,
        isSummary
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || errData.details || `Server responded with ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[geminiClient] Error in sendChatMessage:', error);
    throw error;
  }
}
