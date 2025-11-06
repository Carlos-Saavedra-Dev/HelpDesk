export interface TicketInput {
  userId: string;
  title: string;
  description: string;
  priority: 'Baja' | 'Media' | 'Alta';
}
