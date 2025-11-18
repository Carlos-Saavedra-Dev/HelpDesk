import { Request, Response } from 'express';
import { TicketService } from '../domain/services/ticketService.js';
import { UserService } from '../domain/services/userService.js';
import { TicketStatus, TicketPriority } from '../domain/types/index.js';
import { UploadService } from '../domain/services/uploadService.js';
import { MultimediaService } from '../domain/services/multimediaService.js';
import { EmailService } from '../domain/services/emailService.js';
import { PriorityNames } from '../domain/types/index.js';

const ticketService = new TicketService();
const userService = new UserService();
const uploadService = new UploadService();
const multimediaService = new MultimediaService();
const emailService = new EmailService();


/**
 * RFU-2: Crear un nuevo ticket
 */
export const createTicket = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, category_id, priority_id } = req.body;

    // Validaciones
    if (!title || !description || !category_id || !priority_id) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'title, description, category_id y priority_id son requeridos'
      });
    }

    if (![1, 2, 3].includes(priority_id)) {
      return res.status(400).json({
        error: 'Prioridad inválida',
        message: 'priority_id debe ser: 1 (Baja), 2 (Media), 3 (Alta)'
      });
    }

    const ticket = await ticketService.createTicket(user.id, {
      title,
      description,
      category_id: parseInt(category_id),
      priority_id
    });

    await emailService.notifyTicketCreated(user.email, {
  id: ticket.id,
  title: ticket.title,
  priority: PriorityNames[ticket.priority_id]
});

    res.status(201).json({
      success: true,
      ticket,
      message: 'Ticket creado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en createTicket:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createTicketWithImages = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, category_id, priority_id } = req.body;
    const files = (req as any).files; // Multer adjunta los archivos aquí

    // Validaciones
    if (!title || !description || !category_id || !priority_id) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'title, description, category_id y priority_id son requeridos'
      });
    }

    if (![1, 2, 3].includes(parseInt(priority_id))) {
      return res.status(400).json({
        error: 'Prioridad inválida',
        message: 'priority_id debe ser: 1 (Baja), 2 (Media), 3 (Alta)'
      });
    }

    // Crear el ticket
    const ticket = await ticketService.createTicket(user.id, {
      title,
      description,
      category_id: parseInt(category_id),
      priority_id: parseInt(priority_id)
    });

    // Si hay archivos adjuntos, subirlos
    const uploadedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        // Validar tipo y tamaño
        if (!uploadService.isValidFileType(file.mimetype)) {
          continue; // Skip archivos no permitidos
        }

        if (!uploadService.isValidFileSize(file.size)) {
          continue; // Skip archivos muy grandes
        }

        // Subir a Supabase Storage
        const fileUrl = await uploadService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        // Guardar referencia en la base de datos
        const multimedia = await multimediaService.uploadFile(ticket.id, {
          type: file.mimetype,
          link: fileUrl
        });

        uploadedFiles.push(multimedia);
      }
    }

    await emailService.notifyTicketCreated(user.email, {
      id: ticket.id,
      title: ticket.title,
      priority: PriorityNames[ticket.priority_id]
    });

    res.status(201).json({
      success: true,
      ticket,
      attachments: uploadedFiles,
      message: 'Ticket creado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en createTicketWithImages:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener ticket con sus imágenes
 */
export const getTicketWithImages = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;

    const ticket = await ticketService.getTicketById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket no encontrado'
      });
    }

    // Obtener archivos adjuntos
    const attachments = await multimediaService.getTicketFiles(ticketId);

    res.json({
      success: true,
      ticket: {
        ...ticket,
        attachments
      }
    });

  } catch (error: any) {
    console.error('Error en getTicketWithImages:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFU-4: Obtener todos los tickets del usuario autenticado
 */
export const getUserTickets = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const tickets = await ticketService.getUserTickets(user.id);

    res.json({
      success: true,
      tickets,
      count: tickets.length
    });

  } catch (error: any) {
    console.error('Error en getUserTickets:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFA-1: Obtener todos los tickets (para agentes)
 * RFA-2: Con filtros por estado, prioridad y categoría
 */
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Verificar que sea agente o admin
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);
    if (!isAgentOrAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo agentes y administradores pueden ver todos los tickets'
      });
    }

    // Obtener filtros de query params
    const { sw_status, priority_id, category_id } = req.query;

    const filters: any = {};
    if (sw_status) filters.sw_status = parseInt(sw_status as string);
    if (priority_id) filters.priority_id = parseInt(priority_id as string);
    if (category_id) filters.category_id = parseInt(category_id as string);

    const tickets = await ticketService.getAllTickets(filters);

    res.json({
      success: true,
      tickets,
      count: tickets.length,
      filters
    });

  } catch (error: any) {
    console.error('Error en getAllTickets:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFU-5: Obtener un ticket específico con su historial
 */
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;

    const ticket = await ticketService.getTicketById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket no encontrado'
      });
    }

    // Verificar permisos: solo el dueño o agentes pueden ver el ticket
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);
    if (ticket.user_id !== user.id && !isAgentOrAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para ver este ticket'
      });
    }

    res.json({
      success: true,
      ticket
    });

  } catch (error: any) {
    console.error('Error en getTicketById:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFA-3: Asignar ticket a un agente
 */
export const assignTicket = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;
    const { agente_id } = req.body;

    // Verificar que sea agente o admin
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);
    if (!isAgentOrAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo agentes pueden asignar tickets'
      });
    }

    if (!agente_id) {
      return res.status(400).json({
        error: 'agente_id es requerido'
      });
    }

    // Verificar que el agente existe y es agente/admin
    const agent = await userService.getUserById(agente_id);
    if (!agent || ![2, 3].includes(agent.rol_id)) {
      return res.status(400).json({
        error: 'El usuario especificado no es un agente válido'
      });
    }

    await ticketService.assignTicket(ticketId, agente_id);

    const ticket = await ticketService.getTicketById(ticketId);

    await emailService.notifyTicketAssigned(agent.email, {
      id: ticketId,
      title: ticket.title,
      description: ticket.description,
      priority: PriorityNames[ticket.priority_id as TicketPriority]
    });

    res.json({
      success: true,
      message: 'Ticket asignado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en assignTicket:', error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * RFA-4: Cambiar estado del ticket
 */
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;
    const { sw_status, description } = req.body;

    // Verificar que sea agente o admin
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);
    if (!isAgentOrAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo agentes pueden cambiar el estado de tickets'
      });
    }

    // Validar estado
    const validStatuses = [1, 2, 3, 4, 5, 6, 7];
    if (!validStatuses.includes(sw_status)) {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'sw_status debe ser: 1-7 (Abierto, Asignado, En Progreso, Entregado, Devuelto, Resuelto, Cerrado)'
      });
    }
    
    const ticket = await ticketService.getTicketById(ticketId);
    await ticketService.updateTicketStatus(ticketId, sw_status, description);
    
    await emailService.notifyStatusChange(ticket.user.email, {
      id: ticketId,
      title: ticket.title,
      oldStatus: ticket.sw_status,
      newStatus: sw_status
    });

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en updateTicketStatus:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFA-5: Actualizar prioridad del ticket
 */
export const updateTicketPriority = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;
    const { priority_id } = req.body;

    // Verificar que sea agente o admin
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);
    if (!isAgentOrAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo agentes pueden cambiar la prioridad'
      });
    }

    if (![1, 2, 3].includes(priority_id)) {
      return res.status(400).json({
        error: 'Prioridad inválida',
        message: 'priority_id debe ser: 1 (Baja), 2 (Media), 3 (Alta)'
      });
    }

    await ticketService.updateTicketPriority(ticketId, priority_id);

    res.json({
      success: true,
      message: 'Prioridad actualizada exitosamente'
    });

  } catch (error: any) {
    console.error('Error en updateTicketPriority:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFA-6: Actualizar categoría del ticket
 */
export const updateTicketCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;
    const { category_id } = req.body;

    // Verificar que sea agente o admin
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);
    if (!isAgentOrAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo agentes pueden cambiar la categoría'
      });
    }

    if (!category_id) {
      return res.status(400).json({
        error: 'category_id es requerido'
      });
    }

    await ticketService.updateTicketCategory(ticketId, parseInt(category_id));

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente'
    });

  } catch (error: any) {
    console.error('Error en updateTicketCategory:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFU-8: Usuario devuelve un ticket (no conforme)
 */
export const returnTicket = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;
    const { reason } = req.body;

    // Verificar que el ticket pertenece al usuario
    const ticket = await ticketService.getTicketById(ticketId);
    if (ticket.user_id !== user.id) {
      return res.status(403).json({
        error: 'No puedes devolver un ticket que no te pertenece'
      });
    }

    if (!reason) {
      return res.status(400).json({
        error: 'Debes proporcionar una razón para devolver el ticket'
      });
    }

    await ticketService.returnTicket(ticketId, reason);

    res.json({
      success: true,
      message: 'Ticket devuelto exitosamente'
    });

  } catch (error: any) {
    console.error('Error en returnTicket:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener estadísticas de tickets
 */
export const getTicketStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Si es agente/admin, puede ver estadísticas globales
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);
    const userId = isAgentOrAdmin ? undefined : user.id;

    const stats = await ticketService.getTicketStats(userId);

    res.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('Error en getTicketStats:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener historial de cambios de un ticket
 */
export const getTicketHistory = async (req: Request, res: Response) => {
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

    const history = await ticketService.getTicketHistory(ticketId);

    res.json({
      success: true,
      history,
      count: history.length
    });

  } catch (error: any) {
    console.error('Error en getTicketHistory:', error);
    res.status(500).json({ error: error.message });
  }
};