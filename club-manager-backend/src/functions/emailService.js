// emailService.js - Backend service for sending emails with PDF attachments
const { EmailClient } = require("@azure/communication-email");

class EmailService {
  constructor() {
    this.connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];
    this.client = new EmailClient(this.connectionString);
    this.senderAddress = process.env['SENDER_EMAIL'] || "DoNotReply@centrosportivoorbassano.it";
  }

  async sendRicevutaEmail({
    recipientEmail,
    recipientName,
    subject,
    pdfBuffer,
    fileName,
    isScheda = false,
    ricevutaNumber
  }) {
    try {
      const emailMessage = {
        senderAddress: this.senderAddress,
        content: {
          subject: subject,
          plainText: this.generatePlainTextContent(isScheda, recipientName, ricevutaNumber),
          html: this.generateSimpleHtmlContent(isScheda, recipientName, ricevutaNumber),
        },
        recipients: {
          to: [{ 
            address: recipientEmail,
            displayName: recipientName 
          }],
        },
        attachments: [
          {
            name: fileName,
            contentType: "application/pdf",
            contentInBase64: pdfBuffer.toString('base64')
          }
        ]
      };

      console.log(`Invio ${isScheda ? 'scheda' : 'ricevuta'} a ${recipientEmail}...`);
      
      const poller = await this.client.beginSend(emailMessage);
      const result = await poller.pollUntilDone();

      if (result.status === 'Succeeded') {
        console.log(`Email inviata con successo. ID: ${result.id}`);
        return {
          success: true,
          messageId: result.id,
          message: `${isScheda ? 'Scheda' : 'Ricevuta'} inviata con successo`
        };
      } else {
        console.error('Errore nell\'invio dell\'email:', result);
        return {
          success: false,
          error: result.error || 'Errore sconosciuto nell\'invio',
          message: 'Errore nell\'invio dell\'email'
        };
      }
    } catch (error) {
      console.error('Errore nel servizio email:', error);
      return {
        success: false,
        error: error.message,
        message: 'Errore tecnico nell\'invio dell\'email'
      };
    }
  }

  generatePlainTextContent(isScheda, recipientName, ricevutaNumber) {
    if (isScheda) {
      return `Gentile ${recipientName},

in allegato troverà la sua scheda socio del Centro Sportivo Orbassano.

Cordiali saluti,
Centro Sportivo Orbassano`;
    } else {
      return `Gentile ${recipientName},

in allegato troverà la ricevuta N° ${ricevutaNumber} del Centro Sportivo Orbassano.

Cordiali saluti,
Centro Sportivo Orbassano`;
    }
  }

  generateSimpleHtmlContent(isScheda, recipientName, ricevutaNumber) {
    if (isScheda) {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
            <p>Gentile <strong>${recipientName}</strong>,</p>
            <p>in allegato troverà la sua scheda socio del Centro Sportivo Orbassano.</p>
            <br>
            <p>Cordiali saluti,<br>
            <strong>Centro Sportivo Orbassano</strong></p>
          </body>
        </html>`;
    } else {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
            <p>Gentile <strong>${recipientName}</strong>,</p>
            <p>in allegato troverà la ricevuta N° <strong>${ricevutaNumber}</strong> del Centro Sportivo Orbassano.</p>
            <br>
            <p>Cordiali saluti,<br>
            <strong>Centro Sportivo Orbassano</strong></p>
          </body>
        </html>`;
    }
  }
}

module.exports = new EmailService();

// Azure Function for sending emails with PDF attachments
const { app } = require('@azure/functions');
const { EmailClient } = require("@azure/communication-email");
const { createSuccessResponse, createErrorResponse } = require('../../shared/utils/responseHelper');

// Initialize email client
let emailClient = null;

const getEmailClient = () => {
  if (!emailClient) {
    const connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];
    if (!connectionString) {
      throw new Error('COMMUNICATION_SERVICES_CONNECTION_STRING environment variable is not set');
    }
    emailClient = new EmailClient(connectionString);
  }
  return emailClient;
};

app.http('sendEmail', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'send-email',
    handler: async (request, context) => {
        context.log('Send Email API chiamata:', request.method);

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            };
        }

        try {
            const requestBody = await request.json();
            const {
                recipientEmail,
                recipientName,
                subject,
                pdfBase64,
                fileName,
                isScheda,
                ricevutaNumber
            } = requestBody;

            // Validazione dei dati richiesti
            if (!recipientEmail || !recipientName || !subject || !pdfBase64 || !fileName) {
                return createErrorResponse(400, 'Parametri mancanti per l\'invio dell\'email');
            }

            // Validazione formato email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(recipientEmail)) {
                return createErrorResponse(400, 'Formato email non valido');
            }

            const client = getEmailClient();
            const senderAddress = process.env['SENDER_EMAIL'] || "DoNotReply@centrosportivoorbassano.it";

            // Convert base64 to buffer
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');

            const emailMessage = {
                senderAddress: senderAddress,
                content: {
                    subject: subject,
                    plainText: generatePlainTextContent(isScheda, recipientName, ricevutaNumber),
                    html: generateSimpleHtmlContent(isScheda, recipientName, ricevutaNumber),
                },
                recipients: {
                    to: [{ 
                        address: recipientEmail,
                        displayName: recipientName 
                    }],
                },
                attachments: [
                    {
                        name: fileName,
                        contentType: "application/pdf",
                        contentInBase64: pdfBase64
                    }
                ]
            };

            context.log(`Invio ${isScheda ? 'scheda' : 'ricevuta'} a ${recipientEmail}...`);
            
            const poller = await client.beginSend(emailMessage);
            const result = await poller.pollUntilDone();

            if (result.status === 'Succeeded') {
                context.log(`Email inviata con successo. ID: ${result.id}`);
                return createSuccessResponse({
                    success: true,
                    messageId: result.id,
                    message: `${isScheda ? 'Scheda' : 'Ricevuta'} inviata con successo`
                });
            } else {
                context.log('Errore nell\'invio dell\'email:', result);
                return createErrorResponse(500, 'Errore nell\'invio dell\'email', result.error || 'Errore sconosciuto');
            }

        } catch (error) {
            context.log('Errore nel servizio email:', error);
            return createErrorResponse(500, 'Errore tecnico nell\'invio dell\'email', error.message);
        }
    }
});

function generatePlainTextContent(isScheda, recipientName, ricevutaNumber) {
    if (isScheda) {
        return `Gentile ${recipientName},

in allegato troverà la sua scheda socio del Centro Sportivo Orbassano.

Cordiali saluti,
Centro Sportivo Orbassano`;
    } else {
        return `Gentile ${recipientName},

in allegato troverà la ricevuta N° ${ricevutaNumber} del Centro Sportivo Orbassano.

Cordiali saluti,
Centro Sportivo Orbassano`;
    }
}

function generateSimpleHtmlContent(isScheda, recipientName, ricevutaNumber) {
    if (isScheda) {
        return `
          <html>
            <body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
              <p>Gentile <strong>${recipientName}</strong>,</p>
              <p>in allegato troverà la sua scheda socio del Centro Sportivo Orbassano.</p>
              <br>
              <p>Cordiali saluti,<br>
              <strong>Centro Sportivo Orbassano</strong></p>
            </body>
          </html>`;
    } else {
        return `
          <html>
            <body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
              <p>Gentile <strong>${recipientName}</strong>,</p>
              <p>in allegato troverà la ricevuta N° <strong>${ricevutaNumber}</strong> del Centro Sportivo Orbassano.</p>
              <br>
              <p>Cordiali saluti,<br>
              <strong>Centro Sportivo Orbassano</strong></p>
            </body>
          </html>`;
    }
}