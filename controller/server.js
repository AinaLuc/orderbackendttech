const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Import models
const Client = require('./models/client');
const Business = require('./models/business');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51MnMGrE1uOh1UBiwR33jjaAaUJGqPep8bZdYY90kGojhcxLowwgG5PJ7DuvHMHLPLrhO5kIafevZ99pvVQqBowfa00ikam1umE');
const mongoose = require('mongoose');




// error mongo 


// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.1')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });



// Close the connection when the Node process is terminated
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection disconnected through app termination');
    process.exit(0);
  });
});


// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(cors()); 

// Endpoint to save email and return client ID
app.post('/save-email', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('email',email)

    // Save the email to the client collection
    const newClient = new Client({ email });
    console.log('newClient:', newClient);

    const savedClient = await newClient.save();

    // Return the client ID
    res.json({ clientId: savedClient._id });
  } catch (error) {
    console.error('Error saving email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/save-business/', async (req, res) => {
  try {
    const { name, state, description, newsPub, totalFees, clientId, llcMembers } = req.body;

    // Create a new business document
    const newBusiness = new Business({
      name,
      state,
      description,
      newsPub, // newsPub is optional, it can be omitted if not provided
      totalFees,
      llcMembers, // Save the array of LLC members
    });

    const savedBusiness = await newBusiness.save();

    // Associate the business ID with the client
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { $set: { businessId: savedBusiness._id } },
      { new: true }
    );

    res.json({ clientId: updatedClient._id, businessId: savedBusiness._id });
  } catch (error) {
    console.error('Error saving business:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency, description, payment_method } = req.body;

  console.log('Received request payload:', req.body);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      payment_method,
      confirmation_method: 'manual',
      confirm: true,
      return_url: 'https://tanamtech.online', // Replace with your success page URL

    });

    // Send the client secret to the client
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
