import { Request, Response } from 'express';
import { MultimediaService } from '../domain/services/multimediaService.js';
import { UserService } from '../domain/services/userService.js';
import { TicketService } from '../domain/services/ticketService.js';

const multimediaService = new MultimediaService();
const userService = new UserService();
const ticketService = new TicketService();

/**
 * RFU-3: Subir archivo adjunto a un ticket
 * Espera recibir: { type, link } en el body
 * El archivo ya debe estar subido a Supabase Storage o una URL
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { ticketId } = req.params;
    const { type, link } = req.body;

    if (!type || !link) {
      return res.status(400).json({
        error: 'type y link son requeridos'
      });
    }

    // Verificar que el ticket existe
    const ticket = await ticketService.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket no encontrado'
      });
    }

    // Verificar permisos: solo el dueño o agentes pueden subir archivos
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);
    if (ticket.user_id !== user.id && !isAgentOrAdmin) {
      return res.status(403).json({
        error: 'No tienes permiso para subir archivos a este ticket'
      });
    }

    const file = await multimediaService.uploadFile(ticketId, { type, link });

    res.status(201).json({
      success: true,
      file,
      message: 'Archivo adjuntado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en uploadFile:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener todos los archivos adjuntos de un ticket
 */
export const getTicketFiles = async (req: Request, res: Response) => {
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

    const files = await multimediaService.getTicketFiles(ticketId);

    res.json({
      success: true,
      files,
      count: files.length
    });

  } catch (error: any) {
    console.error('Error en getTicketFiles:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener un archivo específico por ID
 */
export const getFileById = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    const file = await multimediaService.getFileById(fileId);

    if (!file) {
      return res.status(404).json({
        error: 'Archivo no encontrado'
      });
    }

    res.json({
      success: true,
      file
    });

  } catch (error: any) {
    console.error('Error en getFileById:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Eliminar un archivo adjunto
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { fileId } = req.params;

    const file = await multimediaService.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        error: 'Archivo no encontrado'
      });
    }

    // Verificar permisos
    const ticket = await ticketService.getTicketById(file.ticket_header_id);
    const isAgentOrAdmin = await userService.isAgentOrAdmin(user.id);

    if (ticket.user_id !== user.id && !isAgentOrAdmin) {
      return res.status(403).json({
        error: 'No tienes permiso para eliminar este archivo'
      });
    }

    await multimediaService.deleteFile(fileId);

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });

  } catch (error: any) {
    console.error('Error en deleteFile:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener tipos de archivo soportados
 */
export const getSupportedFileTypes = async (req: Request, res: Response) => {
  try {
    const fileTypes = multimediaService.getSupportedFileTypes();

    res.json({
      success: true,
      fileTypes
    });

  } catch (error: any) {
    console.error('Error en getSupportedFileTypes:', error);
    res.status(500).json({ error: error.message });
  }
};