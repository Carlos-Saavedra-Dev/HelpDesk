import express from 'express';
import { verifyAuth } from '../infrastructure/authMiddleware.js';
import { upload } from '../infrastructure/multerConfig.js';
import { createTicketWithImages, getTicketWithImages } from '../controller/ticketController.js';

// Importar controladores
import {
  getUserInformation,
  updateUserProfile,
  getAllUsers,
  getAgentes,
  getUserById,
  updateUserRole,
  deactivateUser,
  activateUser
} from '../controller/userController.js';

import {
  createTicket,
  getUserTickets,
  getAllTickets,
  getTicketById,
  assignTicket,
  updateTicketStatus,
  updateTicketPriority,
  updateTicketCategory,
  returnTicket,
  getTicketStats,
  getTicketHistory
} from '../controller/ticketController.js';

import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controller/categoryController.js';

import {
  userSendMessage,
  agentReplyToUser,
  addInternalNote,
  getTicketConversation,
  getMessages,
  deleteMessage
} from '../controller/conversationController.js';

import {
  uploadFile,
  getTicketFiles,
  getFileById,
  deleteFile,
  getSupportedFileTypes
} from '../controller/multimediaController.js';

const router = express.Router();

// ==================== RUTAS DE AUTENTICACIÓN ====================

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/auth/me', verifyAuth, getUserInformation);

// ==================== RUTAS DE USUARIOS ====================

/**
 * @route   PUT /api/users/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
router.put('/users/profile', verifyAuth, updateUserProfile);

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios (Admin)
 * @access  Private - Admin
 */
router.get('/users', verifyAuth, getAllUsers);

/**
 * @route   GET /api/users/agentes
 * @desc    Obtener todos los agentes
 * @access  Private - Agente/Admin
 */
router.get('/users/agentes', verifyAuth, getAgentes);

/**
 * @route   GET /api/users/:userId
 * @desc    Obtener un usuario específico
 * @access  Private
 */
router.get('/users/:userId', verifyAuth, getUserById);

/**
 * @route   PUT /api/users/:userId/role
 * @desc    Actualizar rol de usuario (Admin)
 * @access  Private - Admin
 */
router.put('/users/:userId/role', verifyAuth, updateUserRole);

/**
 * @route   PUT /api/users/:userId/deactivate
 * @desc    Desactivar usuario (Admin)
 * @access  Private - Admin
 */
router.put('/users/:userId/deactivate', verifyAuth, deactivateUser);

/**
 * @route   PUT /api/users/:userId/activate
 * @desc    Activar usuario (Admin)
 * @access  Private - Admin
 */
router.put('/users/:userId/activate', verifyAuth, activateUser);

// ==================== RUTAS DE TICKETS ====================


// Ruta para crear ticket con imágenes
router.post('/tickets/with-images', verifyAuth, upload.array('images', 5), createTicketWithImages);

// Ruta para obtener ticket con imágenes
router.get('/tickets/:ticketId/with-images', verifyAuth, getTicketWithImages);

/**
 * @route   POST /api/tickets
 * @desc    Crear un nuevo ticket
 * @access  Private
 */
router.post('/tickets', verifyAuth, createTicket);

/**
 * @route   GET /api/tickets/my-tickets
 * @desc    Obtener tickets del usuario autenticado
 * @access  Private
 */
router.get('/tickets/my-tickets', verifyAuth, getUserTickets);

/**
 * @route   GET /api/tickets/all
 * @desc    Obtener todos los tickets (Agentes)
 * @access  Private - Agente/Admin
 */
router.get('/tickets/all', verifyAuth, getAllTickets);

/**
 * @route   GET /api/tickets/stats
 * @desc    Obtener estadísticas de tickets
 * @access  Private
 */
router.get('/tickets/stats', verifyAuth, getTicketStats);

/**
 * @route   GET /api/tickets/:ticketId
 * @desc    Obtener un ticket específico
 * @access  Private
 */
router.get('/tickets/:ticketId', verifyAuth, getTicketById);

/**
 * @route   GET /api/tickets/:ticketId/history
 * @desc    Obtener historial de cambios de un ticket
 * @access  Private
 */
router.get('/tickets/:ticketId/history', verifyAuth, getTicketHistory);

/**
 * @route   PUT /api/tickets/:ticketId/assign
 * @desc    Asignar ticket a un agente
 * @access  Private - Agente/Admin
 */
router.put('/tickets/:ticketId/assign', verifyAuth, assignTicket);

/**
 * @route   PUT /api/tickets/:ticketId/status
 * @desc    Actualizar estado del ticket
 * @access  Private - Agente/Admin
 */
router.put('/tickets/:ticketId/status', verifyAuth, updateTicketStatus);

/**
 * @route   PUT /api/tickets/:ticketId/priority
 * @desc    Actualizar prioridad del ticket
 * @access  Private - Agente/Admin
 */
router.put('/tickets/:ticketId/priority', verifyAuth, updateTicketPriority);

/**
 * @route   PUT /api/tickets/:ticketId/category
 * @desc    Actualizar categoría del ticket
 * @access  Private - Agente/Admin
 */
router.put('/tickets/:ticketId/category', verifyAuth, updateTicketCategory);

/**
 * @route   PUT /api/tickets/:ticketId/return
 * @desc    Devolver ticket (usuario no conforme)
 * @access  Private
 */
router.put('/tickets/:ticketId/return', verifyAuth, returnTicket);

// ==================== RUTAS DE CATEGORÍAS ====================

/**
 * @route   GET /api/categories
 * @desc    Obtener todas las categorías
 * @access  Private
 */
router.get('/categories', verifyAuth, getAllCategories);

/**
 * @route   GET /api/categories/:categoryId
 * @desc    Obtener una categoría específica
 * @access  Private
 */
router.get('/categories/:categoryId', verifyAuth, getCategoryById);

/**
 * @route   POST /api/categories
 * @desc    Crear una nueva categoría (Admin)
 * @access  Private - Admin
 */
router.post('/categories', verifyAuth, createCategory);

/**
 * @route   PUT /api/categories/:categoryId
 * @desc    Actualizar una categoría (Admin)
 * @access  Private - Admin
 */
router.put('/categories/:categoryId', verifyAuth, updateCategory);

/**
 * @route   DELETE /api/categories/:categoryId
 * @desc    Eliminar una categoría (Admin)
 * @access  Private - Admin
 */
router.delete('/categories/:categoryId', verifyAuth, deleteCategory);

// ==================== RUTAS DE CONVERSACIONES Y MENSAJES ====================

/**
 * @route   POST /api/tickets/:ticketId/messages
 * @desc    Usuario envía mensaje al agente
 * @access  Private
 */
router.post('/tickets/:ticketId/messages', verifyAuth, userSendMessage);

/**
 * @route   POST /api/tickets/:ticketId/reply
 * @desc    Agente responde al usuario
 * @access  Private - Agente/Admin
 */
router.post('/tickets/:ticketId/reply', verifyAuth, agentReplyToUser);

/**
 * @route   POST /api/tickets/:ticketId/notes
 * @desc    Añadir nota interna (solo agentes)
 * @access  Private - Agente/Admin
 */
router.post('/tickets/:ticketId/notes', verifyAuth, addInternalNote);

/**
 * @route   GET /api/tickets/:ticketId/conversation
 * @desc    Obtener conversación completa del ticket
 * @access  Private
 */
router.get('/tickets/:ticketId/conversation', verifyAuth, getTicketConversation);

/**
 * @route   GET /api/conversations/:conversationId/messages
 * @desc    Obtener mensajes de una conversación
 * @access  Private
 */
router.get('/conversations/:conversationId/messages', verifyAuth, getMessages);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Eliminar un mensaje (Admin)
 * @access  Private - Admin
 */
router.delete('/messages/:messageId', verifyAuth, deleteMessage);

// ==================== RUTAS DE ARCHIVOS ADJUNTOS ====================

/**
 * @route   POST /api/tickets/:ticketId/files
 * @desc    Subir archivo adjunto
 * @access  Private
 */
router.post('/tickets/:ticketId/files', verifyAuth, uploadFile);

/**
 * @route   GET /api/tickets/:ticketId/files
 * @desc    Obtener archivos de un ticket
 * @access  Private
 */
router.get('/tickets/:ticketId/files', verifyAuth, getTicketFiles);

/**
 * @route   GET /api/files/:fileId
 * @desc    Obtener un archivo específico
 * @access  Private
 */
router.get('/files/:fileId', verifyAuth, getFileById);

/**
 * @route   DELETE /api/files/:fileId
 * @desc    Eliminar un archivo
 * @access  Private
 */
router.delete('/files/:fileId', verifyAuth, deleteFile);

/**
 * @route   GET /api/files/supported-types
 * @desc    Obtener tipos de archivo soportados
 * @access  Public
 */
router.get('/files/supported-types', getSupportedFileTypes);

export default router;