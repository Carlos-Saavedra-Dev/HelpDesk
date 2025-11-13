import { Request, Response } from 'express';
import { ConversationService } from '../domain/services/conversationService.js';
import { UserService } from '../domain/services/userService.js';
import { TicketService } from '../domain/services/ticketService.js';

const conversationService = new ConversationService();
const userService = new UserService();
const ticketService = new TicketService();

/**
 * RFU-7: Usuario envía mensaje al agente
 */
export const userSendMessage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        error: 'El contenido del mensaje es requerido'
      });
    }

    // Verificar que el ticket pertenece al usuario
    const ticket = await ticketService.getTicketById(ticketId);
    if (ticket.user_id !== user.id) {
      return res.status(403).json({
        error: 'No puedes enviar mensajes a un ticket que no te pertenece'
      });
    }

    const message = await conversationService.userSendMessage(
      ticketId,
      user.id,
      content
    );

    res.status(201).json({
      success: true,
      message,
      text: 'Mensaje enviado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en userSendMessage:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFA-7: Agente responde al usuario
 */
export const agentReplyToUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;
    const { content } = req.body;

    // Verificar que sea agente o admin
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);
    if (!isAgentOrAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo agentes pueden responder mensajes'
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({
        error: 'El contenido del mensaje es requerido'
      });
    }

    const message = await conversationService.agentReplyToUser(
      ticketId,
      user.id,
      content
    );

    res.status(201).json({
      success: true,
      message,
      text: 'Respuesta enviada exitosamente'
    });

  } catch (error: any) {
    console.error('Error en agentReplyToUser:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFA-8: Agente añade nota interna (solo visible para agentes)
 */
export const addInternalNote = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;
    const { content } = req.body;

    // Verificar que sea agente o admin
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);
    if (!isAgentOrAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo agentes pueden añadir notas internas'
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({
        error: 'El contenido de la nota es requerido'
      });
    }

    const message = await conversationService.agentAddInternalNote(
      ticketId,
      user.id,
      content
    );

    res.status(201).json({
      success: true,
      message,
      text: 'Nota interna añadida exitosamente'
    });

  } catch (error: any) {
    console.error('Error en addInternalNote:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener conversación completa de un ticket
 */
export const getTicketConversation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;

    // Verificar permisos
    const ticket = await ticketService.getTicketById(ticketId);
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);

    if (ticket.user_id !== user.id && !isAgentOrAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }

    // Solo agentes/admins pueden ver notas internas
    const conversation = await conversationService.getFullTicketConversation(
      ticketId,
      isAgentOrAdmin
    );

    res.json({
      success: true,
      conversation
    });

  } catch (error: any) {
    console.error('Error en getTicketConversation:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener mensajes de una conversación específica
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { conversationId } = req.params;

    const messages = await conversationService.getMessages(conversationId);

    res.json({
      success: true,
      messages,
      count: messages.length
    });

  } catch (error: any) {
    console.error('Error en getMessages:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Eliminar un mensaje (solo el autor o administrador)
 */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { messageId } = req.params;

    // TODO: Verificar que el usuario es el autor o administrador
    const isAdmin = await userService.isAdmin(user.id);
    
    // Por ahora solo admins pueden eliminar mensajes
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administradores pueden eliminar mensajes'
      });
    }

    await conversationService.deleteMessage(messageId);

    res.json({
      success: true,
      message: 'Mensaje eliminado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en deleteMessage:', error);
    res.status(500).json({ error: error.message });
  }
};