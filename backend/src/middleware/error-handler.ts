import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({ message: 'Endpoint não encontrado.' });
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('❌ API Error:', error);
  const statusCode = 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
  const message = statusCode < 500 ? error.message : 'Erro interno do servidor.';
  return res.status(statusCode).json({ message });
}
