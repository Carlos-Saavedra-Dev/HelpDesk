import { supabase } from '../../infrastructure/supabaseClient.js';
import { Multimedia, MultimediaInput } from '../types/index.js';

export class MultimediaService {
  /**
   * RFU-3: Subir archivo adjunto a un ticket
   * Nota: El archivo ya debe estar subido a Supabase Storage o una URL externa
   */
  async uploadFile(
    ticketHeaderId: string,
    input: MultimediaInput
  ): Promise<Multimedia> {
    const { data, error } = await supabase
      .from('tb_multimedia')
      .insert({
        ticket_header_id: ticketHeaderId,
        type: input.type,
        link: input.link
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al guardar archivo: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtener todos los archivos de un ticket
   */
  async getTicketFiles(ticketHeaderId: string): Promise<Multimedia[]> {
    const { data, error } = await supabase
      .from('tb_multimedia')
      .select('*')
      .eq('ticket_header_id', ticketHeaderId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener archivos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener un archivo por ID
   */
  async getFileById(fileId: string): Promise<Multimedia | null> {
    const { data, error } = await supabase
      .from('tb_multimedia')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al obtener archivo: ${error.message}`);
    }

    return data;
  }

  /**
   * Eliminar un archivo
   */
  async deleteFile(fileId: string): Promise<void> {
    const { error } = await supabase
      .from('tb_multimedia')
      .delete()
      .eq('id', fileId);

    if (error) {
      throw new Error(`Error al eliminar archivo: ${error.message}`);
    }
  }

  /**
   * Subir archivo a Supabase Storage (bucket público)
   * Retorna la URL pública del archivo
   */
  async uploadToStorage(
    file: Buffer,
    fileName: string,
    bucketName: string = 'helpdesk-files'
  ): Promise<string> {
    const filePath = `${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: this.getContentType(fileName),
        upsert: false
      });

    if (error) {
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  /**
   * Helper: Obtener content type basado en extensión
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'csv': 'text/csv'
    };

    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Obtener tipos de archivo soportados
   */
  getSupportedFileTypes(): string[] {
    return [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ];
  }
}