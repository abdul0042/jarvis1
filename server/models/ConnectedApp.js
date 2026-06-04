const { mongoose } = require('../db/connect');

const ConnectedAppSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    baseUrl:     { type: String, required: true },
    description: { type: String, default: '' },
    authType:    { type: String, enum: ['none', 'apiKey', 'oauth2', 'bearer'], default: 'none' },
    credentials: { type: mongoose.Schema.Types.Mixed, default: {} }, // store tokens/keys here
    status:      { type: String, enum: ['connected', 'error', 'untested'], default: 'untested' },
    enabled:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ConnectedApp = mongoose.models.ConnectedApp || mongoose.model('ConnectedApp', ConnectedAppSchema);

module.exports = { ConnectedApp };
