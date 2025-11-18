import { supabase } from '../../infrastructure/supabaseClient.js';

export class UploadService {
  private bucketName = 'helpdesk-attachments';

  /**
   * Subir archivo a Supabase Storage
   */
  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${timestamp}-${sanitizedFileName}`;

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  /**
   * Validar tipo de archivo
   */
  isValidFileType(mimeType: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(mimeType);
  }

  /**
   * Validar tamaño de archivo (5MB máximo)
   */
  isValidFileSize(size: number): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return size <= maxSize;
  }

  /**
   * Eliminar archivo de Storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    // Extraer el path del archivo de la URL
    const urlParts = fileUrl.split('/');
    const filePath = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Error al eliminar archivo: ${error.message}`);
    }
  }
}