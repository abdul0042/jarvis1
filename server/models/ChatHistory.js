const { mongoose } = require('../db/connect');

const ChatMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    sender:    { type: String, enum: ['user', 'jarvis', 'system'], required: true },
    text:      { type: String, required: true },
    isError:   { type: Boolean, default: false },
    metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const ChatHistorySchema = new mongoose.Schema(
  {
    sessionId:   { type: String, default: () => new mongoose.Types.ObjectId().toString(), index: true },
    userMessage: { type: String },
    aiAction:    { type: mongoose.Schema.Types.Mixed },
    result:      { type: mongoose.Schema.Types.Mixed },
    aiSummary:   { type: String },
  },
  { timestamps: true }
);

const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
const ChatHistory = mongoose.models.ChatHistory || mongoose.model('ChatHistory', ChatHistorySchema);

module.exports = { ChatMessage, ChatHistory };
