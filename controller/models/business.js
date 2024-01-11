const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  newsPub: {
    type: String,
    required: false, // This field is optional
  },
  totalFees: {
    type: String,
    required: true,
  },
   llcMembers: [
    {
      firstName: String,
      lastName: String,
      address: String,
      dateOfBirth: String,
    }
  ],
},{ timestamps: true });

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;
