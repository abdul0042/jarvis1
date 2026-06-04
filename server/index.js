require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const mongoose                = require('mongoose');
const { connectDB }           = require('./db/connect');
const { ConnectedApp }        = require('./models/ConnectedApp');
const { ChatHistory }         = require('./models/ChatHistory');
const { OAuthToken }          = require('./models/OAuthToken');

const executeRouter = require('./routes/execute');
const chatRouter    = require('./routes/chat');
const gmailRoutes   = require('./routes/gmail');
const sheetsRoutes  = require('./routes/sheets');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Main Routes
app.use('/api/execute', executeRouter);
app.use('/api/chat',    chatRouter);
app.use('/api/gmail',   gmailRoutes);
app.use('/api/sheets',  sheetsRoutes);

// --- In-Memory Database for Mock APIs ---
let mockTodos = [
  { id: 1, title: 'Buy groceries', completed: false },
  { id: 2, title: 'Finish JARVIS dashboard design', completed: true },
];

let mockTransactions = [
  { id: 1, type: 'income', amount: 1500, description: 'Freelance web design', category: 'Income', date: '2026-05-19' },
  { id: 2, type: 'expense', amount: 50, description: 'Lunch at cafe', category: 'Food', date: '2026-05-20' },
];

// --- Mock API: Todo App ---
app.get('/api/mock/todos', (req, res) => {
  console.log('[Mock Todo API] GET /todos');
  res.json({ success: true, count: mockTodos.length, todos: mockTodos });
});

app.post('/api/mock/todos', (req, res) => {
  console.log('[Mock Todo API] POST /todos', req.body);
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }
  const newTodo = {
    id: Date.now(),
    title: title,
    completed: false
  };
  mockTodos.push(newTodo);
  res.status(201).json({ success: true, message: 'Todo created successfully', todo: newTodo });
});

app.put('/api/mock/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`[Mock Todo API] PUT /todos/${id}`, req.body);
  const todo = mockTodos.find(t => t.id === id);
  if (!todo) {
    return res.status(404).json({ success: false, error: 'Todo not found' });
  }
  if (req.body.title !== undefined) todo.title = req.body.title;
  if (req.body.completed !== undefined) todo.completed = req.body.completed;
  res.json({ success: true, message: 'Todo updated successfully', todo });
});

app.delete('/api/mock/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`[Mock Todo API] DELETE /todos/${id}`);
  const initialLength = mockTodos.length;
  mockTodos = mockTodos.filter(t => t.id !== id);
  if (mockTodos.length === initialLength) {
    return res.status(404).json({ success: false, error: 'Todo not found' });
  }
  res.json({ success: true, message: `Todo with ID ${id} deleted successfully` });
});

// --- Mock API: Finance App ---
app.get('/api/mock/finance', (req, res) => {
  console.log('[Mock Finance API] GET /finance');
  res.json({ success: true, count: mockTransactions.length, transactions: mockTransactions });
});

app.post('/api/mock/finance', (req, res) => {
  console.log('[Mock Finance API] POST /finance', req.body);
  const { type, amount, description, category } = req.body;
  if (!type || !amount || !description) {
    return res.status(400).json({ success: false, error: 'Type, amount, and description are required' });
  }
  const newTransaction = {
    id: Date.now(),
    type,
    amount: parseFloat(amount),
    description,
    category: category || 'General',
    date: new Date().toISOString().split('T')[0]
  };
  mockTransactions.push(newTransaction);
  res.status(201).json({ success: true, message: 'Transaction recorded successfully', transaction: newTransaction });
});

// --- Mock API: Weather App ---
app.get('/api/mock/weather', (req, res) => {
  const city = req.query.city || 'San Francisco';
  console.log(`[Mock Weather API] GET /weather?city=${city}`);
  
  // Return some fake weather details
  const weathers = ['Sunny', 'Partly Cloudy', 'Rainy', 'Windy', 'Overcast'];
  const randomIndex = Math.floor(Math.random() * weathers.length);
  const temp = Math.floor(Math.random() * 15) + 15; // 15 to 30 C
  
  res.json({
    success: true,
    city: city,
    temperature: `${temp}°C`,
    condition: weathers[randomIndex],
    humidity: '65%',
    wind: '12 km/h',
    forecast: 'Mild weather expected for the rest of the week'
  });
});

// --- Connected Apps API (persisted in MongoDB) ---

// GET all connected apps
app.get('/api/apps', async (req, res) => {
  try {
    const apps = await ConnectedApp.find({ enabled: true }).lean();
    res.json({ success: true, apps });
  } catch (err) {
    console.error('[MongoDB Error in /api/apps]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST — create or upsert an app by name
app.post('/api/apps', async (req, res) => {
  try {
    const { name, baseUrl, description, authType, credentials, status } = req.body;
    if (!name || !baseUrl) return res.status(400).json({ success: false, error: 'name and baseUrl are required' });
    const app = await ConnectedApp.findOneAndUpdate(
      { name },
      { name, baseUrl, description, authType, credentials, status: status || 'untested', enabled: true },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json({ success: true, app });
  } catch (err) {
    console.error('[MongoDB Error in POST /api/apps]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT — update status of a connected app by id
app.put('/api/apps/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'status is required' });
    const app = await ConnectedApp.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!app) return res.status(404).json({ success: false, error: 'App not found' });
    res.json({ success: true, app });
  } catch (err) {
    console.error('[MongoDB Error in PUT /api/apps/:id/status]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE — disable an app by id
app.delete('/api/apps/:id', async (req, res) => {
  try {
    await ConnectedApp.findByIdAndUpdate(req.params.id, { enabled: false });
    res.json({ success: true, message: 'App disconnected' });
  } catch (err) {
    console.error('[MongoDB Error in DELETE /api/apps]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Chat History API ---

// GET last 50 history entries
app.get('/api/history', async (req, res) => {
  try {
    const history = await ChatHistory.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, history });
  } catch (err) {
    console.error('[MongoDB Error in GET /api/history]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST — save a history entry
app.post('/api/history', async (req, res) => {
  try {
    const entry = await ChatHistory.create(req.body);
    res.status(201).json({ success: true, entry });
  } catch (err) {
    console.error('[MongoDB Error in POST /api/history]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- OAuth Tokens API (Gmail, Sheets) ---

// GET token for a service
app.get('/api/tokens/:service', async (req, res) => {
  try {
    const token = await OAuthToken.findOne({ service: req.params.service }).lean();
    if (!token) return res.status(404).json({ success: false, error: 'No token found' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('[MongoDB Error in GET /api/tokens]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST — upsert a token for a service
app.post('/api/tokens/:service', async (req, res) => {
  try {
    const token = await OAuthToken.findOneAndUpdate(
      { service: req.params.service },
      { service: req.params.service, ...req.body },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json({ success: true, token });
  } catch (err) {
    console.error('[MongoDB Error in POST /api/tokens]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE — remove a token for a service
app.delete('/api/tokens/:service', async (req, res) => {
  try {
    await OAuthToken.deleteOne({ service: req.params.service });
    res.json({ success: true, message: 'Token removed' });
  } catch (err) {
    console.error('[MongoDB Error in DELETE /api/tokens]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Test Connection / Health Check ---
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbLabel  = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus] || 'unknown';
  res.json({ status: 'ok', time: new Date(), db: dbLabel });
});

// Start server after DB is ready
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  JARVIS Backend is running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Connected Apps: http://localhost:${PORT}/api/apps`);
    console.log(`  Chat History:   http://localhost:${PORT}/api/history`);
    console.log(`  Mock APIs available at:`);
    console.log(`    - Todos:   http://localhost:${PORT}/api/mock/todos`);
    console.log(`    - Finance: http://localhost:${PORT}/api/mock/finance`);
    console.log(`    - Weather: http://localhost:${PORT}/api/mock/weather`);
    console.log(`==================================================`);
  });
});
