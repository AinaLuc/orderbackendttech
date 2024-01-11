// models/client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  hasPaid: Boolean,
  firstEmail:Boolean,
  secondEmail:Boolean,
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
},{ timestamps: true });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
