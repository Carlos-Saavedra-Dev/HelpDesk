import { supabase } from '../../infrastructure/supabaseClient.js';
import { 
  Conversation, 
  Message, 
  MessageInput, 
  ConversationType 
} from '../types/index.js';

export class ConversationService {
  /**
   * Obtener o crear conversación global de un ticket
   * (RFU-7 / RFA-7: Comunicación usuario-agente)
   */
  async getOrCreateGlobalConversation(ticketHeaderId: string): Promise<Conversation> {
    // Buscar conversación global existente
    const { data: existing, error: fetchError } = await supabase
      .from('cm_conversation')
      .select('*')
      .eq('ticket_header_id', ticketHeaderId)
      .eq('type', ConversationType.GLOBAL)
      .single();

    if (existing && !fetchError) {
      return existing;
    }

    // Si no existe, crearla
    const { data: newConversation, error: createError } = await supabase
      .from('cm_conversation')
      .insert({
        ticket_header_id: ticketHeaderId,
        type: ConversationType.GLOBAL
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error al crear conversación: ${createError.message}`);
    }

    return newConversation;
  }

  /**
   * RFA-8: Obtener o crear conversación solo para agentes
   */
  async getOrCreateAgentConversation(ticketHeaderId: string): Promise<Conversation> {
    // Buscar conversación de agentes existente
    const { data: existing, error: fetchError } = await supabase
      .from('cm_conversation')
      .select('*')
      .eq('ticket_header_id', ticketHeaderId)
      .eq('type', ConversationType.AGENT_ONLY)
      .single();

    if (existing && !fetchError) {
      return existing;
    }

    // Si no existe, crearla
    const { data: newConversation, error: createError } = await supabase
      .from('cm_conversation')
      .insert({
        ticket_header_id: ticketHeaderId,
        type: ConversationType.AGENT_ONLY
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error al crear conversación de agentes: ${createError.message}`);
    }

    return newConversation;
  }

  /**
   * RFU-7 / RFA-7: Enviar mensaje en una conversación
   */
  async sendMessage(
    conversationId: string, 
    userId: string, 
    input: MessageInput
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('cm_message')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        content: input.content
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al enviar mensaje: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtener todos los mensajes de una conversación
   */
  async getMessages(conversationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cm_message')
      .select(`
        *,
        tb_user!cm_message_user_id_fkey (
          id,
          name,
          email,
          rol_id
        )
      `)
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener mensajes: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtener todas las conversaciones de un ticket
   */
  async getTicketConversations(ticketHeaderId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cm_conversation')
      .select('*')
      .eq('ticket_header_id', ticketHeaderId);

    if (error) {
      throw new Error(`Error al obtener conversaciones: ${error.message}`);
    }

    return data;
  }

  /**
   * RFU-7: Usuario envía mensaje al agente (conversación global)
   */
  async userSendMessage(
    ticketHeaderId: string,
    userId: string,
    content: string
  ): Promise<Message> {
    // Obtener o crear conversación global
    const conversation = await this.getOrCreateGlobalConversation(ticketHeaderId);

    // Enviar mensaje
    return await this.sendMessage(conversation.id, userId, { content });
  }

  /**
   * RFA-7: Agente responde al usuario (conversación global)
   */
  async agentReplyToUser(
    ticketHeaderId: string,
    agentId: string,
    content: string
  ): Promise<Message> {
    // Obtener o crear conversación global
    const conversation = await this.getOrCreateGlobalConversation(ticketHeaderId);

    // Enviar mensaje
    return await this.sendMessage(conversation.id, agentId, { content });
  }

  /**
   * RFA-8: Agente añade nota interna (solo visible para agentes)
   */
  async agentAddInternalNote(
    ticketHeaderId: string,
    agentId: string,
    content: string
  ): Promise<Message> {
    // Obtener o crear conversación de agentes
    const conversation = await this.getOrCreateAgentConversation(ticketHeaderId);

    // Enviar mensaje
    return await this.sendMessage(conversation.id, agentId, { content });
  }

  /**
   * Obtener conversación completa de un ticket con todos sus mensajes
   */
  async getFullTicketConversation(
    ticketHeaderId: string,
    includeAgentNotes: boolean = false
  ): Promise<any> {
    const conversations = await this.getTicketConversations(ticketHeaderId);

    const result: any = {
      global: null,
      agentNotes: null
    };

    for (const conv of conversations) {
      const messages = await this.getMessages(conv.id);

      if (conv.type === ConversationType.GLOBAL) {
        result.global = {
          conversation: conv,
          messages
        };
      } else if (conv.type === ConversationType.AGENT_ONLY && includeAgentNotes) {
        result.agentNotes = {
          conversation: conv,
          messages
        };
      }
    }

    return result;
  }

  /**
   * Eliminar un mensaje (solo el autor o administrador)
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('cm_message')
      .delete()
      .eq('id', messageId);

    if (error) {
      throw new Error(`Error al eliminar mensaje: ${error.message}`);
    }
  }
}