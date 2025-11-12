import { Request, Response } from 'express';
import { CategoryService } from '../domain/services/categoryService.js';
import { UserService } from '../domain/services/userService.js';

const categoryService = new CategoryService();
const userService = new UserService();

/**
 * RFU-10: Obtener todas las categorías
 */
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();

    res.json({
      success: true,
      categories,
      count: categories.length
    });

  } catch (error: any) {
    console.error('Error en getAllCategories:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtener una categoría por ID
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    const category = await categoryService.getCategoryById(parseInt(categoryId));

    if (!category) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      category
    });

  } catch (error: any) {
    console.error('Error en getCategoryById:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RFS-3: Crear una nueva categoría (solo Administradores)
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name } = req.body;

    // Verificar que sea administrador
    const isAdmin = await userService.isAdmin(user.id);
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administradores pueden crear categorías'
      });
    }

    if (!name) {
      return res.status(400).json({
        error: 'El nombre de la categoría es requerido'
      });
    }

    const category = await categoryService.createCategory({ name });

    res.status(201).json({
      success: true,
      category,
      message: 'Categoría creada exitosamente'
    });

  } catch (error: any) {
    console.error('Error en createCategory:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualizar una categoría (solo Administradores)
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { categoryId } = req.params;
    const { name } = req.body;

    // Verificar que sea administrador
    const isAdmin = await userService.isAdmin(user.id);
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administradores pueden actualizar categorías'
      });
    }

    if (!name) {
      return res.status(400).json({
        error: 'El nombre de la categoría es requerido'
      });
    }

    const category = await categoryService.updateCategory(parseInt(categoryId), name);

    res.json({
      success: true,
      category,
      message: 'Categoría actualizada exitosamente'
    });

  } catch (error: any) {
    console.error('Error en updateCategory:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Eliminar una categoría (solo Administradores)
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { categoryId } = req.params;

    // Verificar que sea administrador
    const isAdmin = await userService.isAdmin(user.id);
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administradores pueden eliminar categorías'
      });
    }

    await categoryService.deleteCategory(parseInt(categoryId));

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

  } catch (error: any) {
    console.error('Error en deleteCategory:', error);
    res.status(500).json({ error: error.message });
  }
};