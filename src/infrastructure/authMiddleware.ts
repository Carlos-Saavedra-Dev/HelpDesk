import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Cliente específico para verificar tokens (usa ANON_KEY, no SERVICE_KEY)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/**
 * Middleware para verificar token y extraer info del usuario
 */
export async function verifyAuth(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabaseAuth.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Extraer info del token y agregarla al request
    (req as any).user = {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
      avatarUrl: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture
    };

    next();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}