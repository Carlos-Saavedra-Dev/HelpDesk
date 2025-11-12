import express from 'express';
import { verifyAuth } from '../infrastructure/authMiddleware.js';
import { getUserInformation } from '../controller/userController.js';
import { getTicketsHeader, createTicket } from '../controller/ticketController.js';

const router = express.Router();

// Ruta para obtener info del usuario autenticado
router.get('/auth/me', verifyAuth, getUserInformation);

// Rutas de tickets
router.get('/tickets', verifyAuth, getTicketsHeader);
router.post('/tickets', verifyAuth, createTicket);

export default router;