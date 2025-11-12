import { Request, Response } from 'express';
import { UserService } from '../domain/services/userService.js';

const userService = new UserService();

/**
 * RFU-1: Obtener información del usuario autenticado
 * También crea el perfil si no existe
 */
export const getUserInformation = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    if (!authUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtener o crear usuario en la base de datos
    const user = await userService.getOrCreateUser({
      id: authUser.id,
      email: authUser.email,
      fullName: authUser.fullName,
      avatarUrl: authUser.avatarUrl
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        rol_id: user.rol_id,
        sw_active: user.sw_active,
        job_title: user.job_title,
        created_at: user.created_at
      }
    });

  } catch (error: any) {
    console.error('Error en getUserInformation:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar perfil del usuario
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const { name, job_title } = req.body;

    if (!name && !job_title) {
      return res.status(400).json({
        error: 'Debes proporcionar al menos un campo para actualizar'
      });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (job_title) updates.job_title = job_title;

    const user = await userService.updateUserProfile(authUser.id, updates);

    res.json({
      success: true,
      user,
      message: 'Perfil actualizado correctamente'
    });

  } catch (error: any) {
    console.error('Error en updateUserProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFS-1: Obtener todos los usuarios (solo Administradores)
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    // Verificar que el usuario sea administrador
    const isAdmin = await userService.isAdmin(authUser.id);
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administradores pueden ver todos los usuarios'
      });
    }

    const users = await userService.getAllUsers();

    res.json({
      success: true,
      users,
      count: users.length
    });

  } catch (error: any) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener todos los agentes disponibles
 */
export const getAgentes = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    // Verificar que sea agente o admin
    const isAgentOrAdmin = await userService.isAgentOrAdmin(authUser.id);
    if (!isAgentOrAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo agentes y administradores pueden ver esta información'
      });
    }

    const agentes = await userService.getAgentes();

    res.json({
      success: true,
      agentes,
      count: agentes.length
    });

  } catch (error: any) {
    console.error('Error en getAgentes:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener un usuario específico por ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const { userId } = req.params;

    // Verificar que sea admin o el mismo usuario
    const isAdmin = await userService.isAdmin(authUser.id);
    if (userId !== authUser.id && !isAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error: any) {
    console.error('Error en getUserById:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFS-2: Actualizar rol de usuario (solo Administradores)
 */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const { userId } = req.params;
    const { rol_id } = req.body;

    // Verificar que el usuario sea administrador
    const isAdmin = await userService.isAdmin(authUser.id);
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administradores pueden cambiar roles'
      });
    }

    if (!rol_id) {
      return res.status(400).json({
        error: 'rol_id es requerido'
      });
    }

    // Validar rol_id (asumiendo: 1=Usuario, 2=Agente, 3=Admin)
    const validRoles = [1, 2, 3];
    if (!validRoles.includes(rol_id)) {
      return res.status(400).json({
        error: 'rol_id inválido',
        message: 'rol_id debe ser: 1 (Usuario), 2 (Agente), 3 (Administrador)'
      });
    }

    const user = await userService.updateUserRole(userId, rol_id);

    res.json({
      success: true,
      user,
      message: 'Rol actualizado correctamente'
    });

  } catch (error: any) {
    console.error('Error en updateUserRole:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFS-1: Desactivar usuario (solo Administradores)
 */
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const { userId } = req.params;

    // Verificar que el usuario sea administrador
    const isAdmin = await userService.isAdmin(authUser.id);
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administradores pueden desactivar usuarios'
      });
    }

    // No permitir auto-desactivación
    if (userId === authUser.id) {
      return res.status(400).json({
        error: 'No puedes desactivar tu propia cuenta'
      });
    }

    await userService.deactivateUser(userId);

    res.json({
      success: true,
      message: 'Usuario desactivado correctamente'
    });

  } catch (error: any) {
    console.error('Error en deactivateUser:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Activar usuario (solo Administradores)
 */
export const activateUser = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const { userId } = req.params;

    // Verificar que el usuario sea administrador
    const isAdmin = await userService.isAdmin(authUser.id);
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administradores pueden activar usuarios'
      });
    }

    await userService.activateUser(userId);

    res.json({
      success: true,
      message: 'Usuario activado correctamente'
    });

  } catch (error: any) {
    console.error('Error en activateUser:', error);
    res.status(500).json({ error: error.message });
  }
};