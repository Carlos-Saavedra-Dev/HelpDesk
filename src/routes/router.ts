import express from 'express';
import { verifyAuth } from '../infrastructure/authMiddleware.js';

const router = express.Router();

router.get('/tickets', async (req, res) => {});

export default router;
