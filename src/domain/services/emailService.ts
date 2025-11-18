import { Resend } from 'resend';
import { TicketStatus, TicketStatusNames } from '../types/index.js';

export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    // Usa tu dominio verificado en Resend, o el dominio de prueba
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  }

  /**
   * RFU-6: Notificar creación de ticket al usuario
   */
  async notifyTicketCreated(userEmail: string, ticketData: {
    id: string;
    title: string;
    priority: string;
  }): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject: `✅ Ticket creado: ${ticketData.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Ticket Creado Exitosamente</h2>
            <p>Tu ticket ha sido registrado en nuestro sistema.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>ID:</strong> ${ticketData.id}</p>
              <p><strong>Título:</strong> ${ticketData.title}</p>
              <p><strong>Prioridad:</strong> ${ticketData.priority}</p>
              <p><strong>Estado:</strong> Abierto</p>
            </div>
            
            <p>Recibirás notificaciones sobre cualquier actualización en tu ticket.</p>
            
            <p style="color: #666; font-size: 12px;">
              Este es un mensaje automático, por favor no respondas a este email.
            </p>
          </div>
        `
      });
      console.log(`✅ Email enviado a ${userEmail} - Ticket creado`);
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
    }
  }

  /**
   * RFA-9: Notificar asignación de ticket a agente
   */
  async notifyTicketAssigned(
    agentEmail: string,
    ticketData: {
      id: string;
      title: string;
      description: string;
      priority: string;
    }
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: agentEmail,
        subject: `🎫 Nuevo ticket asignado: ${ticketData.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2196F3;">Nuevo Ticket Asignado</h2>
            <p>Se te ha asignado un nuevo ticket para atender.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>ID:</strong> ${ticketData.id}</p>
              <p><strong>Título:</strong> ${ticketData.title}</p>
              <p><strong>Descripción:</strong> ${ticketData.description}</p>
              <p><strong>Prioridad:</strong> ${ticketData.priority}</p>
            </div>
            
            <p>Por favor, revisa el ticket y comienza a trabajar en él.</p>
          </div>
        `
      });
      console.log(`✅ Email enviado a ${agentEmail} - Ticket asignado`);
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
    }
  }

  /**
   * RFU-6: Notificar cambio de estado al usuario
   */
  async notifyStatusChange(
    userEmail: string,
    ticketData: {
      id: string;
      title: string;
      oldStatus: TicketStatus;
      newStatus: TicketStatus;
    }
  ): Promise<void> {
    const oldStatusName = TicketStatusNames[ticketData.oldStatus];
    const newStatusName = TicketStatusNames[ticketData.newStatus];

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject: `🔄 Actualización de ticket: ${ticketData.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF9800;">Estado del Ticket Actualizado</h2>
            <p>El estado de tu ticket ha cambiado.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>ID:</strong> ${ticketData.id}</p>
              <p><strong>Título:</strong> ${ticketData.title}</p>
              <p><strong>Estado anterior:</strong> ${oldStatusName}</p>
              <p><strong>Estado nuevo:</strong> ${newStatusName}</p>
            </div>
            
            <p>Puedes revisar los detalles en tu panel de tickets.</p>
          </div>
        `
      });
      console.log(`✅ Email enviado a ${userEmail} - Cambio de estado`);
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
    }
  }

  /**
   * RFU-6 / RFA-7: Notificar nuevo mensaje
   */
  async notifyNewMessage(
    recipientEmail: string,
    ticketData: {
      id: string;
      title: string;
    },
    senderName: string,
    messageContent: string
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: recipientEmail,
        subject: `💬 Nuevo mensaje en ticket: ${ticketData.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #9C27B0;">Nuevo Mensaje</h2>
            <p>${senderName} ha enviado un mensaje en tu ticket.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Ticket:</strong> ${ticketData.title}</p>
              <p><strong>Mensaje:</strong></p>
              <p style="padding: 10px; background-color: white; border-left: 3px solid #9C27B0;">
                ${messageContent}
              </p>
            </div>
            
            <p>Responde desde tu panel de tickets.</p>
          </div>
        `
      });
      console.log(`✅ Email enviado a ${recipientEmail} - Nuevo mensaje`);
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
    }
  }

  /**
   * Notificar ticket resuelto
   */
  async notifyTicketResolved(
    userEmail: string,
    ticketData: {
      id: string;
      title: string;
    }
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject: `✅ Ticket resuelto: ${ticketData.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Ticket Resuelto</h2>
            <p>Tu ticket ha sido marcado como resuelto.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>ID:</strong> ${ticketData.id}</p>
              <p><strong>Título:</strong> ${ticketData.title}</p>
            </div>
            
            <p>Si el problema persiste, puedes devolver el ticket para que sea revisado nuevamente.</p>
          </div>
        `
      });
      console.log(`✅ Email enviado a ${userEmail} - Ticket resuelto`);
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
    }
  }
}