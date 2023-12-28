// models/client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  hasPaid: Boolean,
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
