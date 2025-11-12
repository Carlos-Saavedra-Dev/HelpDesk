import { supabase } from '../../infrastructure/supabaseClient.js';
import { User, UserResponse } from '../types/index.js';

export class UserService {
  /**
   * Obtener o crear usuario en tb_user
   * Se llama después de autenticación con Google
   */
  async getOrCreateUser(userData: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }): Promise<UserResponse> {
    // Intentar obtener el usuario existente
    const { data: existingUser, error: fetchError } = await supabase
      .from('tb_user')
      .select('*')
      .eq('id', userData.id)
      .single();

    // Si existe, retornarlo
    if (existingUser && !fetchError) {
      return existingUser;
    }

    // Si no existe, crearlo con rol_id = 1 (Usuario por defecto)
    const { data: newUser, error: createError } = await supabase
      .from('tb_user')
      .insert({
        id: userData.id,
        name: userData.fullName,
        email: userData.email,
        rol_id: 1, // Rol Usuario por defecto
        sw_active: 1, // Activo por defecto
        job_title: 'Empleado'
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error al crear usuario: ${createError.message}`);
    }

    return newUser;
  }

  /**
   * Obtener un usuario por ID
   */
  async getUserById(userId: string): Promise<UserResponse | null> {
    const { data, error } = await supabase
      .from('tb_user')
      .select('*')
      .eq('id', userId)
      .eq('sw_active', 1) // Solo usuarios activos
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtener todos los usuarios (solo para Administradores)
   */
  async getAllUsers(): Promise<UserResponse[]> {
    const { data, error } = await supabase
      .from('tb_user')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtener todos los agentes (rol_id = 2 o 3)
   * Asumiendo: 1 = Usuario, 2 = Agente, 3 = Administrador
   */
  async getAgentes(): Promise<UserResponse[]> {
    const { data, error } = await supabase
      .from('tb_user')
      .select('*')
      .in('rol_id', [2, 3]) // Agentes y Administradores
      .eq('sw_active', 1)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener agentes: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualizar el rol de un usuario
   */
  async updateUserRole(userId: string, newRolId: number): Promise<UserResponse> {
    const { data, error } = await supabase
      .from('tb_user')
      .update({ rol_id: newRolId })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar rol: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateUserProfile(
    userId: string, 
    updates: { name?: string; job_title?: string }
  ): Promise<UserResponse> {
    const { data, error } = await supabase
      .from('tb_user')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }

    return data;
  }

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('tb_user')
      .update({ sw_active: 0 })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error al desactivar usuario: ${error.message}`);
    }
  }

  /**
   * Activar usuario
   */
  async activateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('tb_user')
      .update({ sw_active: 1 })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error al activar usuario: ${error.message}`);
    }
  }

  /**
   * Verificar si un usuario es administrador
   */
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user?.rol_id === 3; // Asumiendo que 3 = Administrador
  }

  /**
   * Verificar si un usuario es agente o administrador
   */
  async isAgentOrAdmin(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user ? [2, 3].includes(user.rol_id) : false;
  }
}