const mongoose = require('mongoose');

const OAuthTokenSchema = new mongoose.Schema(
  {
    service:      { type: String, required: true, unique: true }, // 'gmail' | 'sheets'
    access_token: { type: String, required: true },
    refresh_token:{ type: String, default: '' },
    expiry_date:  { type: Number, default: 0 },
    email:        { type: String, default: '' },
    scope:        { type: String, default: '' },
  },
  { timestamps: true }
);

const OAuthToken = mongoose.models.OAuthToken || mongoose.model('OAuthToken', OAuthTokenSchema);
module.exports = { OAuthToken };
