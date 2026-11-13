import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const req = host.switchToHttp().getRequest<Request & { id?: string }>();
    let status = 500;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      message = typeof r === 'string' ? r : (r as any).message;
    } else if (exception?.code === 11000) {
      status = 409;
      const keys = Object.keys(exception.keyValue ?? {});
      message = keys.length ? `${keys[0]} already exists` : 'Duplicate key';
    } else if (exception?.name === 'ValidationError') {
      status = 400;
      message = Object.values(exception.errors ?? {}).map((e: any) => e.message);
    } else if (exception?.name === 'CastError') {
      status = 400;
      message = `Invalid ${exception.path}`;
    } else {
      console.error(exception);
    }

    const requestId = req.id ?? (res.getHeader('X-Request-Id') as string | undefined);

    res.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: req.url,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}