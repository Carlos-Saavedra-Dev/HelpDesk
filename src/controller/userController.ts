import { Request, Response } from 'express';

/**
 * Obtener información del usuario autenticado
 * La info viene del middleware verifyAuth en req.user
 */
export const getUserInformation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};