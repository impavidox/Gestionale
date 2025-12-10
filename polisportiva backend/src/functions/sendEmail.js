// sendEmail.js - Azure Function for sending emails with PDF attachments
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
                ricevutaNumber,
                customMessage,
                htmlContent
            } = requestBody;

            // Validazione dei dati richiesti
            if (!recipientEmail || !recipientName || !subject) {
                return createErrorResponse(400, 'Parametri mancanti per l\'invio dell\'email');
            }

            // Validazione aggiuntiva per messaggi personalizzati
            if (customMessage && !htmlContent) {
                return createErrorResponse(400, 'htmlContent è richiesto quando customMessage è true');
            }

            // Se c'è un allegato PDF, fileName è richiesto
            if (pdfBase64 && !fileName) {
                return createErrorResponse(400, 'fileName è richiesto quando viene fornito pdfBase64');
            }

            // Validazione formato email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(recipientEmail)) {
                return createErrorResponse(400, 'Formato email non valido');
            }

            const client = getEmailClient();
            const senderAddress = process.env['SENDER_EMAIL'] || "DoNotReply@centrosportivoorbassano.it";

            // Genera il contenuto dell'email in base al tipo
            let emailContent;
            if (customMessage) {
                // Per messaggi personalizzati, usa htmlContent direttamente
                emailContent = {
                    subject: subject,
                    plainText: stripHtmlTags(htmlContent),
                    html: htmlContent,
                };
            } else {
                // Per ricevute/schede, usa i template esistenti
                emailContent = {
                    subject: subject,
                    plainText: generatePlainTextContent(isScheda, recipientName, ricevutaNumber),
                    html: generateSimpleHtmlContent(isScheda, recipientName, ricevutaNumber),
                };
            }

            const emailMessage = {
                senderAddress: senderAddress,
                content: emailContent,
                recipients: {
                    to: [{
                        address: recipientEmail,
                        displayName: recipientName
                    }],
                }
            };

            // Aggiungi l'allegato solo se è presente
            if (pdfBase64 && fileName) {
                emailMessage.attachments = [
                    {
                        name: fileName,
                        contentType: "application/pdf",
                        contentInBase64: pdfBase64
                    }
                ];
            }

            const emailType = customMessage ? 'email personalizzata' : (isScheda ? 'scheda' : 'ricevuta');
            context.log(`Invio ${emailType} a ${recipientEmail}...`);
            
            const poller = await client.beginSend(emailMessage);
            const result = await poller.pollUntilDone();

            if (result.status === 'Succeeded') {
                context.log(`Email inviata con successo. ID: ${result.id}`);
                const successMessage = customMessage
                    ? 'Email personalizzata inviata con successo'
                    : `${isScheda ? 'Scheda' : 'Ricevuta'} inviata con successo`;
                return createSuccessResponse({
                    success: true,
                    messageId: result.id,
                    message: successMessage
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

function stripHtmlTags(html) {
    if (!html) return '';
    // Rimuove i tag HTML per creare una versione plain text
    return html
        .replace(/<style[^>]*>.*<\/style>/gmi, '') // Rimuove tag style
        .replace(/<script[^>]*>.*<\/script>/gmi, '') // Rimuove tag script
        .replace(/<[^>]+>/gm, '') // Rimuove tutti i tag HTML
        .replace(/\s+/g, ' ') // Normalizza gli spazi
        .trim();
}

function generatePlainTextContent(isScheda, recipientName, ricevutaNumber) {
    if (isScheda) {
        return `Gentile ${recipientName},

in allegato troverà la sua scheda socio del Polisportiva Rivoli.

Cordiali saluti,
Polisportiva Rivoli`;
    } else {
        return `Gentile ${recipientName},

in allegato troverà la ricevuta N° ${ricevutaNumber} del Polisportiva Rivoli.

Cordiali saluti,
Polisportiva Rivoli`;
    }
}

function generateSimpleHtmlContent(isScheda, recipientName, ricevutaNumber) {
    if (isScheda) {
        return `
          <html>
            <body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
              <p>Gentile <strong>${recipientName}</strong>,</p>
              <p>in allegato troverà la sua scheda socio del Polisportiva Rivoli.</p>
              <br>
              <p>Cordiali saluti,<br>
              <strong>Polisportiva Rivoli</strong></p>
            </body>
          </html>`;
    } else {
        return `
          <html>
            <body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
              <p>Gentile <strong>${recipientName}</strong>,</p>
              <p>in allegato troverà la ricevuta N° <strong>${ricevutaNumber}</strong> del Polisportiva Rivoli.</p>
              <br>
              <p>Cordiali saluti,<br>
              <strong>Polisportiva Rivoli</strong></p>
            </body>
          </html>`;
    }
}