import { supabase } from '../../infrastructure/supabaseClient.js';
import { 
  TicketHeader, 
  TicketDetail, 
  TicketCreateInput, 
  TicketUpdateInput,
  TicketStatus,
  TicketPriority 
} from '../types/index.js';

export class TicketService {
  /**
   * RFU-2: Crear un nuevo ticket
   */
  async createTicket(userId: string, input: TicketCreateInput): Promise<TicketHeader> {
    const { data, error } = await supabase
      .from('md_ticket_header')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        category_id: input.category_id,
        priority_id: input.priority_id,
        sw_status: TicketStatus.ABIERTO // Estado inicial: Abierto
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear ticket: ${error.message}`);
    }

    // Crear el primer registro en ticket_detail
    await this.createTicketDetail(data.id, {
      sw_status: TicketStatus.ABIERTO,
      description: 'Ticket creado'
    });

    return data;
  }

  /**
   * RFU-4: Obtener todos los tickets de un usuario
   */
  async getUserTickets(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('md_ticket_header')
      .select(`
        *,
        tb_category!md_ticket_header_category_id_fkey (
          id,
          description
        ),
        tb_priority!md_ticket_header_priority_id_fkey (
          id,
          description
        ),
        tb_user!md_ticket_header_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener tickets: ${error.message}`);
    }

    return data;
  }

  /**
   * RFA-1: Obtener todos los tickets (para agentes)
   */
  async getAllTickets(filters?: {
    sw_status?: TicketStatus;
    priority_id?: TicketPriority;
    category_id?: number;
  }): Promise<any[]> {
    let query = supabase
      .from('md_ticket_header')
      .select(`
        *,
        tb_category!md_ticket_header_category_id_fkey (
          id,
          description
        ),
        tb_priority!md_ticket_header_priority_id_fkey (
          id,
          description
        ),
        tb_user!md_ticket_header_user_id_fkey (
          id,
          name,
          email
        )
      `);

    // Aplicar filtros si existen (RFA-2)
    if (filters?.sw_status !== undefined) {
      query = query.eq('sw_status', filters.sw_status);
    }
    if (filters?.priority_id !== undefined) {
      query = query.eq('priority_id', filters.priority_id);
    }
    if (filters?.category_id !== undefined) {
      query = query.eq('category_id', filters.category_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener tickets: ${error.message}`);
    }

    return data;
  }

  /**
   * RFU-5: Obtener un ticket por ID con todos sus detalles
   */
  async getTicketById(ticketId: string): Promise<any> {
    const { data, error } = await supabase
      .from('md_ticket_header')
      .select(`
        *,
        tb_category!md_ticket_header_category_id_fkey (
          id,
          description
        ),
        tb_priority!md_ticket_header_priority_id_fkey (
          id,
          description
        ),
        tb_user!md_ticket_header_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('id', ticketId)
      .single();

    if (error) {
      throw new Error(`Error al obtener ticket: ${error.message}`);
    }

    // Obtener historial de cambios (ticket_detail)
    const details = await this.getTicketHistory(ticketId);

    return {
      ...data,
      history: details
    };
  }

  /**
   * Obtener historial de cambios de un ticket
   */
  async getTicketHistory(ticketId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('md_ticket_detail')
      .select(`
        *,
        tb_user!md_ticket_detail_assigned_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('ticket_header_id', ticketId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener historial: ${error.message}`);
    }

    return data;
  }

  /**
   * RFA-3: Asignar ticket a un agente
   */
  async assignTicket(ticketId: string, agentId: string): Promise<void> {
    // Actualizar el estado a ASIGNADO en header
    const { error: headerError } = await supabase
      .from('md_ticket_header')
      .update({ sw_status: TicketStatus.ASIGNADO })
      .eq('id', ticketId);

    if (headerError) {
      throw new Error(`Error al asignar ticket: ${headerError.message}`);
    }

    // Crear registro en ticket_detail
    await this.createTicketDetail(ticketId, {
      sw_status: TicketStatus.ASIGNADO,
      assigned_user_id: agentId,
      description: 'Ticket asignado a agente'
    });
  }

  /**
   * RFA-4: Cambiar estado del ticket
   */
  async updateTicketStatus(
    ticketId: string, 
    newStatus: TicketStatus,
    description?: string
  ): Promise<void> {
    // Actualizar estado en header
    const { error: headerError } = await supabase
      .from('md_ticket_header')
      .update({ sw_status: newStatus })
      .eq('id', ticketId);

    if (headerError) {
      throw new Error(`Error al actualizar estado: ${headerError.message}`);
    }

    // Crear registro en ticket_detail
    await this.createTicketDetail(ticketId, {
      sw_status: newStatus,
      description: description || 'Cambio de estado'
    });
  }

  /**
   * RFA-5: Actualizar prioridad del ticket
   */
  async updateTicketPriority(
    ticketId: string, 
    newPriority: TicketPriority
  ): Promise<void> {
    const { error } = await supabase
      .from('md_ticket_header')
      .update({ priority_id: newPriority })
      .eq('id', ticketId);

    if (error) {
      throw new Error(`Error al actualizar prioridad: ${error.message}`);
    }

    // Crear registro en ticket_detail
    await this.createTicketDetail(ticketId, {
      sw_status: null as any, // Mantener estado actual
      description: 'Prioridad actualizada'
    });
  }

  /**
   * RFA-6: Actualizar categoría del ticket
   */
  async updateTicketCategory(
    ticketId: string, 
    newCategoryId: number
  ): Promise<void> {
    const { error } = await supabase
      .from('md_ticket_header')
      .update({ category_id: newCategoryId })
      .eq('id', ticketId);

    if (error) {
      throw new Error(`Error al actualizar categoría: ${error.message}`);
    }
  }

  /**
   * RFU-8: Usuario devuelve un ticket (no conforme con la solución)
   */
  async returnTicket(ticketId: string, reason: string): Promise<void> {
    await this.updateTicketStatus(ticketId, TicketStatus.DEVUELTO, reason);
  }

  /**
   * Actualizar ticket completo
   */
  async updateTicket(ticketId: string, updates: TicketUpdateInput): Promise<void> {
    const { error } = await supabase
      .from('md_ticket_header')
      .update(updates)
      .eq('id', ticketId);

    if (error) {
      throw new Error(`Error al actualizar ticket: ${error.message}`);
    }
  }

  /**
   * Crear registro en ticket_detail (historial)
   */
  private async createTicketDetail(
    ticketHeaderId: string,
    detail: {
      sw_status: TicketStatus;
      assigned_user_id?: string;
      description?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('md_ticket_detail')
      .insert({
        ticket_header_id: ticketHeaderId,
        sw_status: detail.sw_status,
        assigned_user_id: detail.assigned_user_id,
        description: detail.description
      });

    if (error) {
      console.error('Error al crear ticket detail:', error);
      // No lanzamos error para no bloquear la operación principal
    }
  }

  /**
   * Obtener estadísticas de tickets
   */
  async getTicketStats(userId?: string): Promise<any> {
    let query = supabase
      .from('md_ticket_header')
      .select('sw_status, priority_id');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }

    // Contar por estado
    const byStatus = data.reduce((acc: any, ticket: any) => {
      acc[ticket.sw_status] = (acc[ticket.sw_status] || 0) + 1;
      return acc;
    }, {});

    // Contar por prioridad
    const byPriority = data.reduce((acc: any, ticket: any) => {
      acc[ticket.priority_id] = (acc[ticket.priority_id] || 0) + 1;
      return acc;
    }, {});

    return {
      total: data.length,
      byStatus,
      byPriority
    };
  }
}