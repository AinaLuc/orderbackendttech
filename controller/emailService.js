const path = require('path');
const ejs = require('ejs');
const { EmailClient, KnownEmailSendStatus } = require("@azure/communication-email");
require("dotenv").config();

class EmailService {
  static async sendOrderConfirmation(email, orderDetails) {
    const connectionString = process.env['AZURE_EMAIL_CONNECTION_STRING'];
    const emailClient = new EmailClient(connectionString);

    try {
      const templatePath = path.join(__dirname, 'templates', 'orderConfirmation.ejs');
      const templateContent = await ejs.renderFile(templatePath, { orderDetails });

      const message = {
        senderAddress: "info@tanamtech.online",
        content: {
          subject: "Order Confirmation",
          html: templateContent,
        },
        recipients: {
          to: [
            {
              address: email,
              displayName: "Lucien",
            },

          ],
          bcc: [
            {
              address: "luaina.mada@gmail.com",
              displayName: "Luaina Mada",
            },
          ],
        },
      };

      await this.sendEmailInternal(emailClient, message);
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
    }
  }

  static async sendRelanceEmail(email,clientId) {
    const connectionString = process.env['AZURE_EMAIL_CONNECTION_STRING'];
    const emailClient = new EmailClient(connectionString);

    try {
      const templatePath = path.join(__dirname, 'templates', 'relanceEmail.ejs');
      const templateContent = await ejs.renderFile(templatePath, { clientId,email });

      const message = {
        senderAddress: "info@tanamtech.online",
        content: {
          subject: "Reminder",
          html: templateContent,
        },
        recipients: {
          to: [
            {
              address: email,
              displayName: "Lucien",
            },
          ],
        },
      };

      await this.sendEmailInternal(emailClient, message);
    } catch (error) {
      console.error('Error sending relance email:', error);
    }
  }

static async sendFollowUpEmail(email, daysAfter, clientId, businessDetails) {
    const connectionString = process.env['AZURE_EMAIL_CONNECTION_STRING'];
    const emailClient = new EmailClient(connectionString);

    try {
        const templatePath = path.join(__dirname, 'templates', 'followUpEmail.ejs');
        const templateContent = await ejs.renderFile(templatePath, {
            // Assuming totalFees is a property of businessDetails
            clientId,
            email,
        });

        const message = {
            senderAddress: "info@tanamtech.online",
            content: {
                subject: "Follow-up Email",
                html: templateContent,
            },
            recipients: {
                to: [
                    {
                        address: email,
                        displayName: "Lucien",
                    },
                ],
            },
        };

        await this.sendEmailInternal(emailClient, message);
    } catch (error) {
        console.error('Error sending follow-up email:', error);
    }
}



  // Common method for sending generic emails
  static async sendEmailInternal(emailClient, message) {
    try {
      const poller = await emailClient.beginSend(message);

      if (!poller.getOperationState().isStarted) {
        throw "Poller was not started.";
      }

      let timeElapsed = 0;
      const POLLER_WAIT_TIME = 10;

      while (!poller.isDone()) {
        poller.poll();
        console.log("Email send polling in progress");

        await new Promise(resolve => setTimeout(resolve, POLLER_WAIT_TIME * 1000));
        timeElapsed += POLLER_WAIT_TIME;

        if (timeElapsed > 18 * POLLER_WAIT_TIME) {
          throw "Polling timed out.";
        }
      }

      if (poller.getResult().status === KnownEmailSendStatus.Succeeded) {
        console.log(`Successfully sent the email (operation id: ${poller.getResult().id})`);
      } else {
        throw poller.getResult().error;
      }
    } catch (e) {
      console.error('Error sending email:', e);
    }
  }
}

module.exports = EmailService;
