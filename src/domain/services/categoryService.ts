import { supabase } from '../../infrastructure/supabaseClient.js';
import { Category, CategoryInput } from '../types/index.js';

export class CategoryService {
  /**
   * RFU-10 / RFS-3: Obtener todas las categorías
   */
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('tb_category')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtener una categoría por ID
   */
  async getCategoryById(categoryId: number): Promise<Category | null> {
    const { data, error } = await supabase
      .from('tb_category')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al obtener categoría: ${error.message}`);
    }

    return data;
  }

  /**
   * RFS-3: Crear una nueva categoría (solo Administradores)
   */
  async createCategory(input: CategoryInput): Promise<Category> {
    const { data, error } = await supabase
      .from('tb_category')
      .insert({ name: input.name })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear categoría: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualizar una categoría (solo Administradores)
   */
  async updateCategory(categoryId: number, name: string): Promise<Category> {
    const { data, error } = await supabase
      .from('tb_category')
      .update({ name })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar categoría: ${error.message}`);
    }

    return data;
  }

  /**
   * Eliminar una categoría (solo Administradores)
   */
  async deleteCategory(categoryId: number): Promise<void> {
    const { error } = await supabase
      .from('tb_category')
      .delete()
      .eq('id', categoryId);

    if (error) {
      throw new Error(`Error al eliminar categoría: ${error.message}`);
    }
  }
}