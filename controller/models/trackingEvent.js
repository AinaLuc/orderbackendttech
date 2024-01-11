// trackingEvent.js
const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
  email: String,
  action: String,
  emailTitle: String,
}, { timestamps: true });

const TrackingEvent = mongoose.model('TrackingEvent', trackingEventSchema);

module.exports = TrackingEvent;
