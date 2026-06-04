# JARVIS — AI-Powered App Hub

JARVIS is a central control panel that links multiple external third-party apps via their API keys and lets you orchestrate them using an AI chatbot powered by the Google Gemini API. Talk, type, or repeat commands to trigger live API integrations.

## Core Features
1. **App Connector System**: Add custom external APIs in Settings (API URLs, headers, prefix formats, description contexts). Credentials remain stored client-side in LocalStorage.
2. **AI Chat Interface**: Type or speak (Web Speech API) commands. The backend constructs prompts dynamically, supplying Gemini (`gemini-1.5-flash`) with connected app contexts.
3. **Execution Engine (Express Proxy)**: Routes requests from the frontend safely, keeping your client credentials local and avoiding server-side database dependencies. Includes three in-memory mock endpoints (Todos, Finance, Weather) for instant out-of-the-box testing.
4. **Dashboard & History**: View connected apps and connection health instantly. Repeat the three most recent actions via quick action buttons. Review logs containing raw collapsible JSON responses.

## Folder Structure
```
jarvis/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx          # Interactive chatbot container
│   │   │   ├── VoiceInput.jsx    # Microphone input capturing
│   │   │   ├── AppCard.jsx       # Display card for connected integrations
│   │   │   ├── AppConnector.jsx  # Connection form (with Mock presets)
│   │   │   └── ResponseViewer.jsx # Collapsible JSON output renderer
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Overview, stats, quick action buttons
│   │   │   ├── ChatPage.jsx      # Chat terminal and execution flow
│   │   │   └── Settings.jsx      # Table listing and adding connections
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.js
│   │   │   ├── useGemini.js
│   │   │   └── useVoice.js
│   │   └── utils/
│   │       ├── geminiClient.js
│   │       └── appExecutor.js
│   └── App.jsx
└── server/               # Express backend
    ├── routes/
    │   ├── execute.js    # Proxy execution path
    │   └── chat.js       # Gemini interface path
    ├── index.js
    └── .env              # Backend configuration (Gemini Key)
```

## Getting Started

### 1. Configure the Backend (.env)
Create or edit `server/.env` and replace `your_gemini_api_key_here` with a valid Google Gemini API Key:
```env
PORT=5000
GEMINI_API_KEY=AIzaSy...
```

### 2. Start the Backend Server
From the root workspace, navigate to `/server` and run:
```bash
cd server
npm install
npm start
```
The backend will run on `http://localhost:5000` and output mock API instructions.

### 3. Run the Frontend Client
Navigate to `/client` and run:
```bash
cd client
npm install
# Configure Tailwind (see prompt)
npm run dev
```

### 4. Testing Out-of-the-box Mocks
Go to Settings, and click **Autofill Mock** presets (Todos, Finance, or Weather). These connect to the backend's local mock APIs. Test connections and start talking to JARVIS!
- *Example command*: `"Add a todo task to buy milk"`
- *Example command*: `"What is the weather in Paris?"`
- *Example command*: `"Record an expense of 45 dollars for dinner category Food"`