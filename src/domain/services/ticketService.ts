import { supabase } from '../../infrastructure/supabaseClient.js';
import { TicketInput } from '../types/ticket.js';

export class TicketService {
  async getTicketsHeader(userId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async createTicket(ticket: TicketInput) {
    const { data, error } = await supabase.from('tickets').insert([
      {
        user_id: ticket.userId,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: 'Abierto',
      },
    ]);

    if (error) throw new Error(error.message);
    return data?.[0];
  }
}
