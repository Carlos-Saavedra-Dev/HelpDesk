import { Request, Response } from 'express';
import { TicketService } from '../domain/services/ticketService.js';

const ticketService = new TicketService();

export const getTicketsHeader = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tickets = await ticketService.getTicketsHeader(user.id);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, priority } = req.body;
    const ticket = await ticketService.createTicket({
      userId: user.id,
      title,
      description,
      priority,
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};
