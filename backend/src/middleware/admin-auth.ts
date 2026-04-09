import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.header('x-admin-key');

  if (!key || key !== env.adminAccessKey) {
    return res.status(401).json({ message: 'Acesso não autorizado.' });
  }

  return next();
}
