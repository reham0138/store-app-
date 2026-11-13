import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const rawKey = req.headers['x-api-key'];
    const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const adminKey = this.config.get<string>('ADMIN_API_KEY');
    const staffKey = this.config.get<string>('STAFF_API_KEY');

    if (apiKey == null) {
      req.role = 'visitor';
    } else if (apiKey === adminKey) {
      req.role = 'admin';
    } else if (apiKey === staffKey) {
      req.role = 'staff';
    } else {
      req.role = null;
      if (required) {
        throw new UnauthorizedException('Valid API key required');
      }
    }

    if (!required) return true;
    if (!req.role) {
      throw new UnauthorizedException('Valid API key required');
    }
    if (!required.includes(req.role)) {
      throw new ForbiddenException('Your role cannot do this');
    }
    return true;
  }
}
