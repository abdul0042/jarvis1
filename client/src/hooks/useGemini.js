import { useState } from 'react';
import { sendChatMessage } from '../utils/geminiClient';

export function useGemini() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // We maintain a separate history array in the exact format Gemini API expects
  const [apiHistory, setApiHistory] = useState([]);

  /**
   * Helper to add a message to the UI list and update the history
   */
  const addMessageToUi = (message) => {
    const newMessage = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      ...message
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const sendMessage = async (text, connectedApps, isSilent = false, language = 'english', isSummary = false) => {
    setIsLoading(true);
    setError(null);

    // 1. Add message to UI
    if (!isSilent) {
      addMessageToUi({ sender: 'user', text });
    }

    try {
      // Retrieve user salutation from local storage
      let salutation = 'Sir';
      try {
        const raw = localStorage.getItem('jarvis_user_salutation');
        if (raw) salutation = JSON.parse(raw);
      } catch (e) {}

      // 2. Call backend Gemini endpoint
      const response = await sendChatMessage(text, apiHistory, connectedApps, language, salutation, isSummary);
      
      // Update our Gemini-compatible history
      const newHistory = [
        ...apiHistory,
        { role: 'user', parts: [{ text }] }
      ];

      if (response.type === 'action') {
        // Model decided to take action
        const actionMsg = addMessageToUi({
          sender: 'jarvis',
          type: 'action',
          action: response.action,
          text: response.action.explanation || 'Executing action...'
        });

        // Add response to apiHistory
        setApiHistory([
          ...newHistory,
          { role: 'model', parts: [{ text: response.rawResponse }] }
        ]);

        // NOTE: do NOT set isLoading=false here — the caller (ChatPage) will
        // keep the spinner alive through the full multi-step action chain.
        return { type: 'action', action: response.action, messageId: actionMsg.id };
      } else if (response.type === 'ui_action') {
        // Model decided to take a UI action
        setApiHistory([
          ...newHistory,
          { role: 'model', parts: [{ text: response.rawResponse }] }
        ]);
        return response;
      } else {
        // Model replied with normal text
        addMessageToUi({
          sender: 'jarvis',
          type: 'text',
          text: response.text
        });

        // Add response to apiHistory
        setApiHistory([
          ...newHistory,
          { role: 'model', parts: [{ text: response.text }] }
        ]);

        setIsLoading(false);
        return { type: 'text', text: response.text };
      }
    } catch (err) {
      console.error('useGemini error:', err);
      setError(err.message || 'Something went wrong while talking to JARVIS.');
      addMessageToUi({
        sender: 'jarvis',
        type: 'text',
        text: 'Sorry, I encountered an error. Please make sure the backend is running and GEMINI_API_KEY is set in server/.env.',
        isError: true
      });
      setIsLoading(false);
      return { type: 'error', error: err.message };
    }
  };

  const clearChat = () => {
    let salutation = 'Sir';
    try {
      const raw = localStorage.getItem('jarvis_user_salutation');
      if (raw) salutation = JSON.parse(raw);
    } catch (e) {}
    setMessages([
      {
        id: 'welcome',
        sender: 'jarvis',
        text: `Hello ${salutation}! I am JARVIS. How can I help you today?`,
        timestamp: Date.now()
      }
    ]);
    setApiHistory([]);
    setError(null);
  };

  const updateMessage = (id, fields) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...fields } : msg))
    );
  };

  return {
    messages,
    isLoading,
    setIsLoading,
    error,
    sendMessage,
    clearChat,
    addMessageToUi,
    updateMessage,
    setMessages
  };
}
