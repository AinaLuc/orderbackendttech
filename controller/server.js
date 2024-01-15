const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron'); // Import the cron module


const app = express();
const port = 3000;
const path = require('path'); // Add this line to import the path module

const fs = require('fs');
const ejs = require('ejs');


// Import models
const Client = require('./models/client');
const Business = require('./models/business');
// Add this line at the top of your server file
const TrackingEvent = require('./models/trackingEvent');

const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const EmailService = require('./emailService');

const mongoose = require('mongoose');
require('dotenv').config();




// error mongo 


// Define the MongoDB connection string based on the environment
const mongoConnectionString = process.env.NODE_ENV === 'production'
  ? process.env.MONGODB_PROD_URI
  : process.env.MONGODB_DEV_URI;

// Connect to MongoDB
mongoose.connect(mongoConnectionString)
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
app.use(express.static(path.join(__dirname, 'public')));


// Cron job to check user status every 10 minutes
//cron.schedule('*/10 * * * *', async () => {
cron.schedule('*/5 * * * *', async () => {
  try {
    const usersToRelance = await Client.find({
      hasPaid: false,
      businessId: { $exists: false },
      firstEmail: { $exists: false }, // Users who haven't received the first email

      //send email after 24 hours
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },

    });

    console.log('Users to Relance:', usersToRelance);

    for (const user of usersToRelance) {
      console.log('Sending relance email to user:', user.email);
      await EmailService.sendRelanceEmail(user.email, user._id);
      // Update the firstEmail field to true after sending the email
      await Client.findByIdAndUpdate(user._id, { $set: { firstEmail: true } });
    
    }
  } catch (error) {
    console.error('Error in relance cron job:', error);
  }
});



// Cron job to send follow-up email after 2 days
//cron.schedule('0 0 */2 * *', async () => {
cron.schedule('*/10 * * * *', async () => {
    try {
        const usersToFollowUp = await Client.find({
            hasPaid: false,
            firstEmail: { $exists: true },
            createdAt: { $lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        });

            console.log('Users to follow up:', usersToFollowUp);


        for (const user of usersToFollowUp) {
            const businessDetails = await Business.findOne({ _id: user.businessId });
            await EmailService.sendFollowUpEmail(user.email, 2, user._id, businessDetails);
                  await Client.findByIdAndUpdate(user._id, { $set: { secondEmail: true } });

        }
    } catch (error) {
        console.error('Error in follow-up cron job:', error);
    }
});

app.get('/tracking-data', async (req, res) => {
  try {
    // Fetch tracking data from MongoDB
    const trackingData = await TrackingEvent.find();

    // Read the EJS template file
    const templatePath = path.join(__dirname, 'templates', 'trackingData.ejs');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');

    // Render the EJS template with tracking data
    const renderedHtml = ejs.render(templateContent, { trackingData });

    // Respond with the rendered HTML
    res.send(renderedHtml);
  } catch (error) {
    console.error('Error rendering tracking data:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Modify your existing tracking endpoint
app.get('/track.gif', async (req, res) => {
  try {
    const { email, action, emailTitle } = req.query;
   console.log('inside gif tracking')
    // Log the email open or click event to MongoDB
    const trackingEvent = new TrackingEvent({ email, action, emailTitle });
    await trackingEvent.save();

    // Respond with the 1x1 transparent pixel
    res.sendFile(path.join(__dirname, 'public', 'track.gif'));
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Endpoint to save email and return client ID
app.post('/save-email', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('email',email)

    // Save the email to the client collection
    const newClient = new Client({ email,hasPaid:false });
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
  const { amount, currency, description, payment_method,clientId } = req.body;

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

     // Update the user collection with payment status
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { $set: { hasPaid: true } },
      { new: true }
    );

    // Now you can use the EmailService to send the order confirmation email
    const orderEmail = updatedClient.email;
    console.log('update client id',updatedClient.businessId)
  const businessDetails = await Business.findOne({ _id: updatedClient.businessId });

      console.log('update client id',businessDetails)


const orderDetails = {
  name: businessDetails.name,
  state: businessDetails.state,
  description: businessDetails.description,
  newsPub: businessDetails.newsPub || 'N/A',
  totalFees: businessDetails.totalFees,
  llcMembers: businessDetails.llcMembers || [],
};
   EmailService.sendOrderConfirmation(orderEmail, orderDetails);

    // Send the client secret to the client
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
     // Check if it's a StripeCardError
          console.log('error typ'error.type)

    if (error.type === 'StripeCardError') {

      console.log(error.type)
      res.status(400).json({ error: error.raw.decline_code || 'Card declined' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
