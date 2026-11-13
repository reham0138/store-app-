import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function requestIdMiddleware(
  req: Request & { id?: string },
  res: Response,
  next: NextFunction,
) {
  const id = randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);

  const start = Date.now();
  res.on('finish', () => {
    console.log(
      `${id.slice(0, 8)} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
    );
  });

  next();
}