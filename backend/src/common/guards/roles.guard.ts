import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();

    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const authHeader = req.headers.authorization;

    // Check JWT token first
    if (authHeader) {
      if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Invalid authorization header');
      }

      const token = authHeader.substring(7);

      try {
        const payload = await this.jwtService.verifyAsync(token);

        if (
          !['customer', 'staff', 'branchManager', 'admin'].includes(
            payload.role,
          )
        ) {
          throw new UnauthorizedException('Invalid user role');
        }
        if (
          (payload.role === 'branchManager' || payload.role === 'staff') &&
          !payload.branchId
        ) {
          throw new UnauthorizedException('Branch manager must have a branch');
        }

        req.user = payload;
        req.role = payload.role === 'staff' ? 'branchManager' : payload.role;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    } else {
      // Keep the old API key system working
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
    }

    if (!required) return true;

    if (!req.role) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!required.includes(req.role)) {
      throw new ForbiddenException('Your role cannot do this');
    }

    return true;
  }
}
