const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

router.post('/', async (req, res) => {
  const { message, history, connectedApps, language, salutation, isGreeting, isSummary } = req.body;

  const localDate = new Date();
  const localDateString = localDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const localTimeString = localDate.toLocaleTimeString();

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // ── SUMMARY MODE: use a clean, lightweight interpreter prompt ────────────
    if (isSummary) {
      const summaryModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: `You are JARVIS. You have already executed an API action and received data.
Your only job is to read the data in the user message and answer their question in 1-2 sentences.
Never output JSON. Never say "Done". Never perform new actions. Just answer directly.
Address the user as "${salutation || 'Sir'}".
${language === 'tanglish' ? 'Respond in Tanglish.' : 'Respond in English.'}`
      });

      const summaryResult = await summaryModel.generateContent(message);
      const summaryText = summaryResult.response.text().trim();
      console.log(`[JARVIS Summary] Response: ${summaryText}`);
      return res.json({ type: 'text', text: summaryText, rawResponse: summaryText });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Format connected apps JSON
    const appsListString = JSON.stringify(connectedApps || [], null, 2);

    // Build system instruction
    const connectedAppNames = (connectedApps || []).map(a => a.name).join(', ') || 'none';

    let systemPrompt = `You are JARVIS, an AI assistant that controls connected apps on behalf of the user.

## SYSTEM AWARENESS
You have full knowledge of this application. Here is everything you know about it:
- This app is called JARVIS — an AI-powered command center that connects to external services via their REST APIs.
- It has an Integrations page where the user can connect, disconnect, and manage third-party apps.
- It has a Chat page (where you currently are) for issuing commands and asking questions.
- It has a History page that logs every past action taken.
- It has a Dashboard with quick-action buttons for common tasks.

## CURRENTLY CONNECTED INTEGRATIONS
The following apps are ACTIVELY CONNECTED right now (authenticated and ready to use):
${appsListString}

Connected app names: ${connectedAppNames}

If the user asks "is X connected?", "do I have X?", or "what apps are connected?" — answer DIRECTLY from the list above. Do NOT say you cannot check. If the app appears in the list above, it IS connected and authenticated. If it does not appear, it is NOT connected.

IMPORTANT: Never mention internal implementation details like localStorage, access tokens, OAuth flows, or code internals when answering connection-status questions. Just tell the user plainly whether the app is connected or not based on the list.

## TIME & ENVIRONMENT CONTEXT
- Today's date is: ${localDateString}
- Current local time is: ${localTimeString}

## APP-SPECIFIC HINTS
- Orders API (WooCommerce, Billzzy, F3): To query, count, or generate reports for orders on apps like WooCommerce, Billzzy, or F3, ALWAYS use the WooCommerce REST API standard query parameters 'after', 'before', 'per_page=100', and 'status=any' to ensure all orders of any status are retrieved without pagination limits. For example, to get orders for today (${localDateString}) from WooCommerce or Billzzy, construct the endpoint as: 'GET /orders?after=${localDateString}T00:00:00&before=${localDateString}T23:59:59&per_page=100&status=any'. Billzzy is fully WooCommerce-compatible and supports the exact same endpoint and date filter parameters.
- Google Sheets API: Google Sheets integration. Can create new spreadsheets automatically without asking the user for a spreadsheetId. When creating a WooCommerce or Billzzy report, fetch the orders first (using per_page=100 and status=any), then send them to POST /woo-report with a body: { orders: [...], title: "Report title" } to handle creating the spreadsheet and appending the orders in a single backend call. Endpoints: POST /woo-report — generate a WooCommerce orders report (body: { orders, title }), POST /create — create a new spreadsheet (body: title), POST /append — append rows to a sheet (body: spreadsheetId, range, values), GET /read — read sheet data (body: spreadsheetId, range).

## HOW TO HANDLE COMMANDS
When the user gives an action command targeting an EXTERNAL APP (e.g. "send email", "get orders", "check inbox"):
1. Identify which connected app to use
2. Determine the correct REST API endpoint and HTTP method
3. Construct the JSON payload
4. Respond ONLY with a JSON object in this exact format:
{
  "app": "<appName>",
  "method": "POST | GET | PUT | DELETE",
  "endpoint": "/path/to/endpoint",
  "payload": { ... },
  "explanation": "Plain English summary of what you're doing"
}

## HOW TO HANDLE IN-APP UI COMMANDS — ABSOLUTE RULE
You ARE a fully integrated AI controller for the JARVIS application. You CAN and MUST navigate pages, clear the chat, and open features within the app by returning a ui_action JSON.

NEVER say "I cannot open pages", "I don't have the ability to navigate", or anything that refuses a navigation request. You have FULL control over the app's UI. When the user asks you to open, go to, navigate, or show any page — you MUST return the JSON below immediately.

When the user wants to navigate, control, or modify the JARVIS app's configuration (like disconnecting integrations), respond ONLY with:
{
  "ui_action": "<action>",
  "target_app": "<target_app_name_if_applicable>",
  "explanation": "Brief friendly confirmation"
}

Available ui_actions — use the BEST match:
- "navigate_dashboard"    → user says: go to dashboard, home, main page, show dashboard
- "navigate_chat"         → user says: go to chat, open terminal, chat page
- "navigate_integrations" → user says: go to integrations, manage apps, connected apps
- "navigate_settings"     → user says: open settings, settings page, go to settings, open the settings page, show settings
- "clear_chat"            → user says: clear chat, wipe chat, reset conversation, clear screen
- "open_voice"            → user says: open voice, voice assistant, voice mode, enable voice
- "scroll_top"            → user says: scroll to top, go to top
- "scroll_bottom"         → user says: scroll down, go to bottom
- "disconnect_app"        → user says: disconnect [app name], remove [app name] integration, disable [app name] connection (Note: always populate the "target_app" key with the lowercase name of the app to disconnect, e.g., "gmail", "sheets", "woocommerce", etc.)

TRIGGER WORDS that ALWAYS produce a ui_action (never a text refusal):
open, go to, navigate to, take me to, show me, launch, bring up + [any page name]

## HOW TO HANDLE GENERAL QUESTIONS
If the user is asking a general question, asking about connection status, or conversational — respond in plain text.

CRITICAL: For any action (api or ui), output ONLY the raw JSON object — no markdown, no code blocks, no explanation text outside the JSON.`;

    // Add User Salutation Preference
    if (salutation) {
      systemPrompt += `\n\nSALUTATION INSTRUCTION: The user prefers you address them as "${salutation}". You MUST address them by this title/name (e.g. "Sure, ${salutation}", "Hello ${salutation}") in all of your conversational outputs, explanations, summaries, and questions.`;
    }

    // Adjust language instructions
    if (language === 'tanglish') {
      systemPrompt += `\n\nLANGUAGE INSTRUCTION: The user prefers Tanglish (a blend of Tamil and English written in English/Latin characters, e.g. "recent orders check pannu" or "Paris la weather enna?"). You must understand Tanglish queries. When you respond in plain text, explain actions, summarize results, or ask clarifying questions, you MUST do so in natural, friendly Tanglish (e.g. "Integration execute panni mudichachu!"). Keep the action JSON structures intact.`;
    } else {
      systemPrompt += `\n\nLANGUAGE INSTRUCTION: Respond and communicate in English.`;
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt
    });

    // Process history to ensure it matches the Gemini SDK format
    // Each item: { role: 'user'|'model', parts: [{ text: '...' }] }
    const formattedHistory = (history || []).map(item => {
      // Ensure role is either 'user' or 'model'
      const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
      return {
        role: role,
        parts: Array.isArray(item.parts) ? item.parts : [{ text: item.text || item.content || '' }]
      };
    });

    console.log(`[JARVIS Chat] System prompt loaded with ${connectedApps?.length || 0} apps.`);
    console.log(`[JARVIS Chat] Sending message: "${message}"`);

    // Start a chat session with history
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        // We do not force JSON mode, so that Gemini can respond with text for clarifying questions
        temperature: 0.2,
      }
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text().trim();

    console.log(`[JARVIS Chat] Raw Gemini Response:`, responseText);

    // If this is a greeting, bypass JSON parsing and just return text
    if (req.body.isGreeting) {
      return res.json({
        type: 'text',
        text: responseText,
        rawResponse: responseText
      });
    }

    // Attempt to parse the response as JSON to see if it is an action
    let action = null;
    let isAction = false;

    let cleanedText = responseText.trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0].trim();
    }

    console.log('[DEBUG] cleanedText before parse:', cleanedText);

    try {
      const parsed = JSON.parse(cleanedText);
      // Check for ui_action first
      if (parsed && typeof parsed === 'object' && parsed.ui_action) {
        return res.json({
          type: 'ui_action',
          ui_action: parsed.ui_action,
          target_app: parsed.target_app || '',
          explanation: parsed.explanation || '',
          rawResponse: responseText
        });
      }
      // Validate that it fits the api action schema
      if (parsed && typeof parsed === 'object' && parsed.app && parsed.method && parsed.endpoint) {
        action = parsed;
        isAction = true;
      }
    } catch (e) {
      // Not a valid JSON action, or contains trailing/leading text. Treat as text response.
    }

    if (isAction) {
      return res.json({
        type: 'action',
        action: action,
        rawResponse: responseText
      });
    } else {
      return res.json({
        type: 'text',
        text: responseText,
        rawResponse: responseText
      });
    }
  } catch (error) {
    console.error('[JARVIS Chat] Error calling Gemini:', error);
    return res.status(500).json({
      error: 'Error calling Gemini API',
      details: error.message
    });
  }
});

module.exports = router;
