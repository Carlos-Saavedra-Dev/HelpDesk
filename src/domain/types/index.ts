// ==================== ENUMS ====================

// Estados de ticket (sw_status en md_ticket_header y md_ticket_detail)
export enum TicketStatus {
  ABIERTO = 1,
  ASIGNADO = 2,
  EN_PROGRESO = 3,
  ENTREGADO = 4,
  DEVUELTO = 5,
  RESUELTO = 6,
  CERRADO = 7
}

// Prioridades (priority_id en md_ticket_header)
export enum TicketPriority {
  BAJA = 1,
  MEDIA = 2,
  ALTA = 3
}

// Tipos de conversación (type en cm_conversation)
export enum ConversationType {
  GLOBAL = 1,      // Conversación visible para usuario y agentes
  AGENT_ONLY = 2   // Conversación solo entre agentes
}

// ==================== INTERFACES DE USUARIO ====================

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  rol_id: number;
  created_at?: Date;
  sw_active?: number; // 0 = inactivo, 1 = activo
  job_title?: string;
  createdBy?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  rol_id: number;
  sw_active: number;
  job_title?: string;
  created_at: Date;
}

// ==================== INTERFACES DE TICKET ====================

export interface TicketHeader {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: Date;
  sw_status: TicketStatus;
  category_id: number;
  priority_id: TicketPriority;
}

export interface TicketDetail {
  id: string;
  sw_status: TicketStatus;
  assigned_user_id?: string; // ID del agente asignado
  updated_at: Date;
  description?: string; // Descripción del cambio/actualización
}

export interface TicketCreateInput {
  title: string;
  description: string;
  category_id: number;
  priority_id: TicketPriority;
}

export interface TicketUpdateInput {
  title?: string;
  description?: string;
  sw_status?: TicketStatus;
  category_id?: number;
  priority_id?: TicketPriority;
  assigned_user_id?: string;
}

// ==================== INTERFACES DE CATEGORÍA ====================

export interface Category {
  id: number;
  name: string;
}

export interface CategoryInput {
  name: string;
}

// ==================== INTERFACES DE PRIORIDAD ====================

export interface Priority {
  id: number;
  description: string;
}

// ==================== INTERFACES DE ROL ====================

export interface Rol {
  id: number;
  description: string;
}

// ==================== INTERFACES DE CONVERSACIÓN ====================

export interface Conversation {
  id: string;
  ticket_header_id: string;
  type: ConversationType; // 1 = global, 2 = solo agentes
}

export interface Message {
  id: string;
  conversation_id: string;
  sent_at: Date;
  content: string;
  user_id: string;
}

export interface MessageInput {
  content: string;
}

// ==================== INTERFACES DE MULTIMEDIA ====================

export interface Multimedia {
  id: string;
  type: string; // Tipo de archivo (image, pdf, etc.)
  link: string; // URL del archivo
  ticket_header_id: string;
}

export interface MultimediaInput {
  type: string;
  link: string;
}

// ==================== HELPERS DE CONVERSIÓN ====================

export const TicketStatusNames: Record<TicketStatus, string> = {
  [TicketStatus.ABIERTO]: 'Abierto',
  [TicketStatus.ASIGNADO]: 'Asignado',
  [TicketStatus.EN_PROGRESO]: 'En Progreso',
  [TicketStatus.ENTREGADO]: 'Entregado',
  [TicketStatus.DEVUELTO]: 'Devuelto',
  [TicketStatus.RESUELTO]: 'Resuelto',
  [TicketStatus.CERRADO]: 'Cerrado'
};

export const PriorityNames: Record<TicketPriority, string> = {
  [TicketPriority.BAJA]: 'Baja',
  [TicketPriority.MEDIA]: 'Media',
  [TicketPriority.ALTA]: 'Alta'
};