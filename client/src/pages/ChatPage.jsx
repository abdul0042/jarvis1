import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chat } from '../components/Chat';
import { executeAction } from '../utils/appExecutor';

/* ─── Scoped styles (same visual system as Dashboard) ─── */
const CHAT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

  .ct-root {
    font-family: 'Share Tech Mono', monospace;
    background: #000000;
    color: #00ff41;
    position: relative;
    min-height: 100%;
  }

  /* dot-grid background */
  .ct-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, #00ff4118 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }

  /* scanline overlay */
  .ct-root::after {
    content: '';
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,255,65,0.015) 2px,
      rgba(0,255,65,0.015) 4px
    );
    pointer-events: none;
    z-index: 0;
  }

  .ct-inner {
    position: relative;
    z-index: 1;
  }

  /* page title bar */
  .ct-title-bar {
    border-bottom: 1px solid #00ff4155;
    padding: 10px 0;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    letter-spacing: 0.18em;
  }

  /* warning banner */
  .ct-warn {
    border: 1px solid #ff313155;
    background: #0a0202;
    padding: 10px 16px;
    margin-bottom: 16px;
    font-size: 12px;
    color: #ff3131;
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ct-warn-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #ff3131;
    box-shadow: 0 0 6px #ff3131;
    flex-shrink: 0;
  }
`;

function useChatStyle(css) {
  useEffect(() => {
    const id = 'ct-hacker-style';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => {
      const tag = document.getElementById(id);
      if (tag) tag.remove();
    };
  }, []);
}

export function ChatPage({ apps, setApps, history, setHistory, gemini }) {
  useChatStyle(CHAT_STYLE);

  const { messages, isLoading, setIsLoading, sendMessage, clearChat, addMessageToUi, updateMessage, setMessages } = gemini;
  const location = useLocation();
  const navigate = useNavigate();

  // Load contextual greeting on mount
  useEffect(() => {
    const loadGreeting = async () => {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
      const connectedAppNames = apps.map(a => a.name).join(', ') || 'none';
      const lastActionRaw = localStorage.getItem('jarvis_history');
      const lastAction = lastActionRaw ? JSON.parse(lastActionRaw).slice(-1)[0] : null;
      const lastActionText = lastAction ? lastAction.userMessage : 'none';

      let salutation = 'Sir';
      try {
        const raw = localStorage.getItem('jarvis_user_salutation');
        if (raw) salutation = JSON.parse(raw);
      } catch (e) {}

      const prompt = `You are VBOS, the AI assistant. Generate a single short greeting message for the user named ${salutation}.

Context:
- Time of day: ${timeOfDay}
- Current time: ${new Date().toLocaleTimeString()}
- Connected apps: ${connectedAppNames}
- Last command given: ${lastActionText}

Rules:
- Max 2 sentences
- Sound like VBOS — intelligent, calm, slightly witty
- Reference the time of day naturally
- If there are connected apps mention one casually
- If there was a recent command reference it subtly
- Never say "How can I help you" or "What can I do for you"
- Never be generic or robotic
- Feel personal to ${salutation} specifically
- Examples of good tone:
  "Good evening, ${salutation}. WooCommerce is running clean — shall we pick up where we left off?"
  "Morning. Your store's been quiet overnight. Ready to change that?"
  "Late night again, ${salutation}. Gmail and WooCommerce are standing by."
  "Good afternoon. Last I checked you were looking at orders — want to continue?"

Respond with ONLY the greeting. No JSON. No extra text.`;

      // Set temporary typing indicator
      setMessages([{ id: 'greeting-loading', sender: 'jarvis', text: 'Initializing systems...', timestamp: Date.now(), isGreeting: true }]);

      try {
        const sanitizedApps = apps.map(a => ({ name: a.name, baseUrl: a.baseUrl, description: a.description }));
        const response = await fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: prompt,
            history: [],
            connectedApps: sanitizedApps,
            isGreeting: true
          })
        });
        const data = await response.json();
        const greetingText = data.text || data.rawResponse || `Standing by, ${salutation}.`;
        setMessages([{ id: 'welcome', sender: 'jarvis', text: greetingText, timestamp: Date.now(), isGreeting: true }]);
      } catch (err) {
        setMessages([{ id: 'welcome', sender: 'jarvis', text: `Standing by, ${salutation}.`, timestamp: Date.now(), isGreeting: true }]);
      }
    };

    if (messages.length === 0) {
      loadGreeting();
    }
  }, [apps, messages.length]);

  // Handle quick action auto-run from dashboard or voice trigger state
  useEffect(() => {
    if (location.state?.autoRunCommand && apps.length > 0) {
      const command = location.state.autoRunCommand;
      window.history.replaceState({}, document.title);
      handleNewMessage(command);
    }
  }, [location.state?.autoRunCommand, apps]);

  // Clean up location state once it has been processed
  useEffect(() => {
    if (location.state && !location.state.autoRunCommand) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleNewMessage = async (text, language = 'english') => {
    setIsLoading(true); // keep spinner alive for the full chain

    // Retrieve user salutation from local storage
    let salutation = 'Sir';
    try {
      const raw = localStorage.getItem('jarvis_user_salutation');
      if (raw) salutation = JSON.parse(raw);
    } catch (e) { }

    let currentResponse = await sendMessage(text, apps, false, language);

    // ── Handle UI (in-app) actions ──────────────────────────────────────────
    if (currentResponse && currentResponse.type === 'ui_action') {
      const uiAction = currentResponse.ui_action;
      const explanation = currentResponse.explanation;

      const UI_ACTION_MAP = {
        navigate_dashboard: { path: '/', label: 'Navigating to Dashboard...' },
        navigate_chat: { path: '/chat', label: 'Navigating to Chat Terminal...' },
        navigate_integrations: { path: '/integrations', label: 'Opening Integrations...' },
        navigate_settings: { path: '/settings', label: 'Opening Settings...' },
      };

      if (UI_ACTION_MAP[uiAction]) {
        addMessageToUi({ sender: 'system', text: UI_ACTION_MAP[uiAction].label });
        addMessageToUi({ sender: 'jarvis', text: explanation || UI_ACTION_MAP[uiAction].label });
        setIsLoading(false);
        setTimeout(() => navigate(UI_ACTION_MAP[uiAction].path), 600);
        return;
      }

      if (uiAction === 'clear_chat') {
        addMessageToUi({ sender: 'jarvis', text: explanation || 'Clearing the chat, Sir.' });
        setIsLoading(false);
        setTimeout(() => clearChat(), 800);
        return;
      }

      if (uiAction === 'open_voice') {
        addMessageToUi({ sender: 'system', text: 'Launching voice assistant...' });
        addMessageToUi({ sender: 'jarvis', text: explanation || 'Opening voice assistant, Sir.' });
        setIsLoading(false);
        setTimeout(() => window.dispatchEvent(new CustomEvent('launch-vbos-assistant')), 600);
        return;
      }

      if (uiAction === 'scroll_top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        addMessageToUi({ sender: 'jarvis', text: explanation || 'Scrolled to top.' });
        setIsLoading(false);
        return;
      }

      if (uiAction === 'scroll_bottom') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        addMessageToUi({ sender: 'jarvis', text: explanation || 'Scrolled to bottom.' });
        setIsLoading(false);
        return;
      }

      if (uiAction === 'disconnect_app') {
        const targetApp = currentResponse.target_app || '';
        addMessageToUi({ sender: 'system', text: `Disconnecting ${targetApp || 'app'}...` });
        addMessageToUi({ sender: 'jarvis', text: explanation || `Disconnecting ${targetApp || 'app'}, Sir.` });

        setIsLoading(true);
        setTimeout(async () => {
          try {
            if (targetApp.toLowerCase() === 'gmail') {
              await fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/gmail', { method: 'DELETE' });
              localStorage.removeItem('jarvis_gmail_tokens');
              if (setApps) setApps(prev => prev.filter(a => !a.isGmail && !a.name.toLowerCase().includes('gmail')));
            } else if (targetApp.toLowerCase() === 'sheets' || targetApp.toLowerCase() === 'google sheets') {
              await fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/sheets', { method: 'DELETE' });
              localStorage.removeItem('jarvis_sheets_tokens');
              if (setApps) setApps(prev => prev.filter(a => !a.isSheets && !a.name.toLowerCase().includes('sheet')));
            } else {
              // Custom app
              const matchingApp = apps.find(app =>
                app.name.toLowerCase() === targetApp.toLowerCase() ||
                app.name.toLowerCase().includes(targetApp.toLowerCase()) ||
                targetApp.toLowerCase().includes(app.name.toLowerCase())
              );
              if (matchingApp) {
                await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + ''}/api/apps/${matchingApp.id}`, { method: 'DELETE' });
                if (setApps) setApps(prev => prev.filter(app => app.id !== matchingApp.id));
              } else {
                addMessageToUi({ sender: 'jarvis', text: `Could not find any connected app named "${targetApp}" to disconnect, Sir.` });
              }
            }
          } catch (err) {
            console.error('[VBOS] Disconnect error:', err);
          } finally {
            setIsLoading(false);
          }
        }, 800);
        return;
      }


      // Unknown ui_action — just show the explanation
      addMessageToUi({ sender: 'jarvis', text: explanation || `UI action "${uiAction}" executed.` });
      setIsLoading(false);
      return;
    }
    // ────────────────────────────────────────────────────────────────────────

    // Keep executing as long as Gemini wants to take actions (sequential chaining)
    while (currentResponse && currentResponse.type === 'action') {
      try {
        const { action, messageId } = currentResponse;

        const matchingApp = apps.find(
          (app) =>
            app.name.toLowerCase() === action.app.toLowerCase() ||
            app.name.toLowerCase().includes(action.app.toLowerCase()) ||
            action.app.toLowerCase().includes(app.name.toLowerCase())
        );

        if (!matchingApp) {
          addMessageToUi({
            sender: 'jarvis',
            text: `Error: App "${action.app}" requested by Gemini is not connected. Connect it in Settings.`,
            isError: true,
          });
          setIsLoading(false);
          return;
        }

        addMessageToUi({
          sender: 'system',
          text: `Orchestrating: ${action.method} request to ${matchingApp.name} ...`,
        });

        const apiResult = await executeAction(matchingApp, action);

        if (messageId) {
          updateMessage(messageId, { apiResponse: apiResult });
        }

        const MAX_RESPONSE_CHARS = 30000;
        const rawResultString = JSON.stringify(apiResult.data, null, 2) || '{}';
        const resultString =
          rawResultString.length > MAX_RESPONSE_CHARS
            ? rawResultString.substring(0, MAX_RESPONSE_CHARS) +
            `\n...[Response truncated, ${rawResultString.length} total chars]`
            : rawResultString;

        console.log('[DEBUG] resultString:', resultString);

        // ── If the API call itself failed, surface the error directly ──────────
        const apiErrored = !apiResult.status || apiResult.status >= 400 || apiResult.error;
        if (apiErrored) {
          const errMsg = apiResult.data?.error || apiResult.error || `API returned status ${apiResult.status}`;
          const isAuthError = apiResult.status === 401 || (typeof errMsg === 'string' && errMsg.toLowerCase().includes('token'));
          let finalMsg;
          if (isAuthError) {
            const isGoogleApp = matchingApp.name.toLowerCase().includes('gmail') || matchingApp.name.toLowerCase().includes('sheet');
            if (isGoogleApp) {
              finalMsg = `Gmail/Sheets access token has expired, ${salutation}. Please go to Integrations, disconnect, and reconnect it to refresh your credentials.`;
            } else {
              finalMsg = `Authentication failed for ${matchingApp.name}, ${salutation}. Please verify your API key, consumer key/secret, or token credentials in Integrations settings.`;
            }
          } else {
            finalMsg = `The request to ${matchingApp.name} failed: ${errMsg}`;
          }

          addMessageToUi({ sender: 'jarvis', text: finalMsg, isError: !isAuthError });
          const newHistoryItem = {
            id: crypto.randomUUID(), timestamp: Date.now(),
            userMessage: text, aiAction: action,
            result: { status: apiResult.status, body: { error: errMsg } },
            aiSummary: finalMsg,
          };
          fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHistoryItem)
          }).catch(console.error);
          setHistory((prev) => [newHistoryItem, ...prev]);
          setIsLoading(false);
          return;
        }



        // ── Build reply directly from data — no Gemini needed for known shapes ──
        const buildDirectResponse = (action, data, sal) => {
          const ep = (action.endpoint || '').toLowerCase().split('?')[0];
          const method = (action.method || '').toUpperCase();

          const isMultiStepFlow = /sheet|spreadsheet|report|csv|excel|write|append/i.test(text);
          if (isMultiStepFlow) {
            return null; // Let Gemini orchestrate the multi-step flow
          }

          // Gmail: inbox / unread
          if (ep.includes('/inbox') && method === 'GET') {
            const count = data?.count ?? data?.emails?.length;
            if (count === undefined) return null;
            if (count === 0) return `You have no unread emails, ${sal}.`;
            const senders = (data?.emails || [])
              .slice(0, 3)
              .map(e => e.from?.split('<')?.[0]?.trim()?.replace(/"/g, '') || '')
              .filter(Boolean);
            const fromPart = senders.length ? ` Latest from: ${senders.join(', ')}.` : '';
            return `You have ${count} unread email${count !== 1 ? 's' : ''}, ${sal}.${fromPart}`;
          }

          // Gmail: send email
          if (ep.includes('/send') && method === 'POST') {
            return data?.message ? `${data.message}, ${sal}.` : `Email sent successfully, ${sal}.`;
          }

          // Gmail: mark-read
          if (ep.includes('/mark-read')) {
            return `Email marked as read, ${sal}.`;
          }

          // Orders list (WooCommerce, f3, or any REST app)
          if (ep.includes('/orders') && method === 'GET') {
            if (matchingApp.name.toLowerCase().includes('f3')) {
              return null; // Skip direct response for F3 so it falls through to Gemini's summary prompt
            }
            // Handle multiple response shapes:
            // 1. Plain array: [...]
            // 2. f3 shape:    { success, data: [...] }
            // 3. WooCommerce: array directly
            // 4. Generic:     { orders: [...] } or { data: [...] }
            const rawOrders =
              Array.isArray(data) ? data :
                Array.isArray(data?.data) ? data.data :
                  Array.isArray(data?.orders) ? data.orders :
                    Array.isArray(data?.results) ? data.results :
                      Array.isArray(data?.items) ? data.items :
                        null;

            const isCountRequest = /count|how many|number of|total|printed/i.test(text);
            if (Array.isArray(rawOrders)) {
              if (isCountRequest) {
                // 1. Check explicit total fields (from wrapper object)
                const dataTotal =
                  data?.total ??
                  data?.total_orders ??
                  data?.total_count ??
                  data?.totalCount ??
                  data?.totalOrders ??
                  data?.count ??
                  data?.meta?.total ??
                  data?.meta?.count ??
                  data?.pagination?.total ??
                  data?.pagination?.count ??
                  data?._meta?.total ??
                  data?.recordsTotal ??
                  data?.records_total;

                // 2. Check all common pagination headers (axios normalizes to lowercase)
                const h = apiResult?.headers || {};
                const headerTotal =
                  h['x-wp-total'] ??
                  h['x-total-count'] ??
                  h['x-total'] ??
                  h['x-count'] ??
                  h['total-count'] ??
                  h['x-pagination-total'] ??
                  h['x-records-count'] ??
                  h['cf-meta-total'];

                const totalCount =
                  (dataTotal !== undefined && dataTotal !== null)
                    ? parseInt(dataTotal, 10)
                    : (headerTotal !== undefined && headerTotal !== null)
                      ? parseInt(headerTotal, 10)
                      : rawOrders.length; // use array length as final fallback

                return `You have ${totalCount} order${totalCount !== 1 ? 's' : ''}, ${sal}.`;
              }
              if (rawOrders.length > 0) {
                const latest = rawOrders[0];
                return `The latest order is #${latest.id || latest.number || latest.orderId} — ${latest.status || 'unknown status'} for ${latest.billing?.first_name || latest.customer_name || latest.customerName || 'a customer'}, ${sal}.`;
              }
              return `No orders found, ${sal}.`;
            }
          }

          // CipherGate: workers list
          if (ep.includes('/workers') && method === 'GET') {
            const workers = Array.isArray(data) ? data : (data?.workers || data?.data);
            if (Array.isArray(workers)) {
              if (workers.length === 0) return `No workers found on CipherGate, ${sal}.`;
              const names = workers.map(w => w.name).join(', ');
              return `Sir, the worker names on CipherGate are: ${names}.`;
            }
          }

          // WooCommerce: products list
          if (ep.includes('/products') && method === 'GET') {
            const products = Array.isArray(data) ? data : data?.products;
            if (Array.isArray(products)) {
              if (products.length === 0) return `No products found, ${sal}.`;
              return `Found ${products.length} product${products.length !== 1 ? 's' : ''}, ${sal}. First: "${products[0]?.name || 'Unknown'}" — ${products[0]?.stock_status || ''}.`;
            }
          }

          // Google Sheets: fetch metadata
          if (ep.includes('/spreadsheets/') && method === 'GET') {
            const sheets = data?.sheets || [];
            const sheetNames = sheets.map(s => s.properties?.title).filter(Boolean);
            const list = sheetNames.length ? ` Sheets present: ${sheetNames.join(', ')}.` : '';
            return `Loaded spreadsheet "${data?.properties?.title || 'Google Sheet'}" successfully, ${sal}.${list}`;
          }

          // Google Sheets: read cell values
          if (ep.includes('/values') && method === 'GET') {
            const values = data?.values || [];
            if (values.length === 0) return `The requested sheet/range is empty, ${sal}.`;
            return `Fetched ${values.length} row${values.length !== 1 ? 's' : ''} from sheet, ${sal}. Here is the first row: ${JSON.stringify(values[0])}.`;
          }

          // Google Sheets: append rows
          if (ep.includes('/values/append') && method === 'POST') {
            return `Successfully appended row(s) to the sheet, ${sal}. ${data?.updatedCells ? `Updated ${data.updatedCells} cells.` : ''}`;
          }

          // Google Sheets: create spreadsheet
          if (ep.endsWith('/create') && method === 'POST') {
            return `Created spreadsheet "${data?.title || 'Weekly Report'}" successfully, ${sal}. Spreadsheet ID: ${data?.spreadsheetId || ''}. Link: ${data?.spreadsheetUrl || ''}`;
          }

          // Google Sheets: WooCommerce report generator
          if (ep.endsWith('/woo-report') && method === 'POST') {
            return `WooCommerce orders report successfully generated, ${sal}! Title: "${data?.title || 'WooCommerce Weekly Report'}". Link: ${data?.spreadsheetUrl || ''}`;
          }

          // Google Sheets: append rows
          if (ep.endsWith('/append') && method === 'POST') {
            return `Successfully appended data to the sheet, ${sal}.`;
          }

          // Google Sheets: read sheet
          if (ep.endsWith('/read') && method === 'GET') {
            const values = data?.values || [];
            if (values.length === 0) return `The requested sheet is empty, ${sal}.`;
            return `Read ${values.length} row${values.length !== 1 ? 's' : ''} from sheet, ${sal}. First row: ${JSON.stringify(values[0])}`;
          }

          // Google Sheets: update values
          if (ep.includes('/values/update') && method === 'PUT') {
            return `Successfully updated the sheet data, ${sal}. ${data?.updatedCells ? `Updated ${data.updatedCells} cells.` : ''}`;
          }

          // Generic success with a message field
          if (data?.success === true && data?.message) {
            return `${data.message}, ${sal}.`;
          }

          return null; // Unknown shape — fall through to Gemini
        };

        const directReply = buildDirectResponse(action, apiResult.data, salutation);
        if (directReply) {
          console.log('[VBOS] Direct response (no Gemini):', directReply);
          addMessageToUi({ sender: 'jarvis', text: directReply });
          const newHistoryItem = {
            id: crypto.randomUUID(), timestamp: Date.now(),
            userMessage: text, aiAction: action,
            result: { status: apiResult.status, body: apiResult.data },
            aiSummary: directReply,
          };
          fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHistoryItem)
          }).catch(console.error);
          setHistory((prev) => [newHistoryItem, ...prev]);
          // ✅ Task done via direct reply
          addMessageToUi({ sender: 'system', text: '✓ TASK COMPLETE' });
          setIsLoading(false);
          return;
        }

        // ── Fallback: unknown response shape or multi-step continuation → send data back to Gemini ──

        // Detect if this was an orders fetch so we can use a richer prompt
        const isOrdersEndpoint = (action.endpoint || '').toLowerCase().includes('/orders');
        const ordersData =
          Array.isArray(apiResult.data) ? apiResult.data :
            Array.isArray(apiResult.data?.data) ? apiResult.data.data :
              Array.isArray(apiResult.data?.orders) ? apiResult.data.orders :
                null;
        const ordersCount = ordersData ? ordersData.length : 0;

        const isF3 = matchingApp.name.toLowerCase().includes('f3');

        const summaryPrompt = isF3
          ? `
You fetched a list of orders from F3 Engine.
The response contains ${apiResult.data?.data?.length || 0} orders in the data array.

Here is the data:
${resultString}

User asked: "${text}"

Summarize ALL orders — give:
1. Total count
2. Breakdown by status (how many pending, processing, completed, cancelled)
3. List the first 5 orders with order number, customer name, amount and status
4. Do NOT just mention one order
5. Address the user as Sir
`
          : (isOrdersEndpoint && ordersData
            ? `
You just fetched orders from ${matchingApp.name}. The response contains ${ordersCount} order${ordersCount !== 1 ? 's' : ''}.

User asked: "${text}"

Full order data:
${resultString}

Instructions:
- Give the total order count (${ordersCount}).
- Break down orders by status (e.g. pending, completed, processing, etc.) with counts.
- List each customer name and their order amount if available.
- If the user asked about a specific date, confirm which orders match that date.
- Be concise but complete. Do NOT say "Done" or output JSON.
- Address the user as "${salutation}".
`
            : `
Here is the result of the API call you just executed:

What was done: ${action.explanation || `${action.method} ${action.endpoint} on ${matchingApp.name}`}
HTTP Status: ${apiResult.status}

Data returned:
${resultString}

User's original request: "${text}"

Instructions:
1. Review the data returned from the previous step.
2. If you need to perform another action to complete the user's request (e.g. sending the data to Google Sheets /woo-report, or sending an email), respond ONLY with the next JSON action object.
3. If no further actions are needed and the request is fully complete, provide your final response to the user in plain text.
- Do NOT output "Done" or "Action completed". Just provide the final answer or next JSON action.
- Address the user as "${salutation}".
`);

        const summaryResult = await sendMessage(summaryPrompt, apps, true, language, true);

        // If Gemini returned text, it is our final reply.
        if (summaryResult.type === 'text') {
          const finalSummary = summaryResult.text;
          const newHistoryItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            userMessage: text,
            aiAction: action,
            result: {
              status: apiResult.status,
              body: apiResult.data || { error: apiResult.error },
            },
            aiSummary: finalSummary,
          };
          fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHistoryItem)
          }).catch(console.error);
          setHistory((prev) => [newHistoryItem, ...prev]);
          // ✅ Task done via Gemini summary
          addMessageToUi({ sender: 'system', text: '✓ TASK COMPLETE' });
          currentResponse = null; // exit loop
        } else {
          // Gemini returned another action! Loop again to execute it.
          currentResponse = summaryResult;
        }

      } catch (actionErr) {
        console.error('[VBOS] Action handler crashed:', actionErr);
        addMessageToUi({
          sender: 'jarvis',
          text: `Something went wrong processing the response. Please try again.`,
          isError: true,
        });
        setIsLoading(false);
        return;
      }
    }

    // If we exited the loop normally (text response from the first sendMessage call)
    if (currentResponse && currentResponse.type === 'text') {
      // plain conversation reply — no action was taken, nothing extra to do
    }

    setIsLoading(false);
  };

  return (
    <div className="ct-root">
      <div className="ct-inner">

        {/* No-apps warning */}
        {apps.length === 0 && (
          <div className="ct-warn">
            <span className="ct-warn-dot" />
            <span>
              <strong>WARNING:</strong> No integrations connected. Navigate to{' '}
              <strong>Integrations</strong> and add an app before issuing commands.
            </span>
          </div>
        )}

        {/* Main Chat Interface */}
        <Chat
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleNewMessage}
          connectedApps={apps}
          clearChat={clearChat}
          history={history}
          showHistoryInitially={location.state?.openHistory || false}
          initialInputText={location.state?.autoFillCommand || ''}
        />

      </div>
    </div>
  );
}
