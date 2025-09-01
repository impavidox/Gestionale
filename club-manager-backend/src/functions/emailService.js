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