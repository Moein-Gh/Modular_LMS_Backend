import { UsersService } from '@app/application/user/services/users.service';
import { ConfigService } from '@app/config';
import { UserStatus } from '@app/domain';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHmac } from 'crypto';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

function parseCookie(req: Request, name: string): string | undefined {
  const header = req.headers?.cookie ?? '';
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function base64urlDecode(input: string): string {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = input.length % 4;
  if (pad) input += '='.repeat(4 - pad);
  return Buffer.from(input, 'base64').toString('utf8');
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = parseCookie(req, 'accessToken');
    if (!token) throw new UnauthorizedException('Missing access token');

    const secret = this.config.get('JWT_SECRET') || 'dev_secret';
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Malformed token');
    const [header, body, signature] = parts;
    const expected = createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (expected !== signature)
      throw new UnauthorizedException('Invalid token');

    const payload = JSON.parse(base64urlDecode(body)) as {
      sub: string;
      exp: number;
    };
    if (!payload?.sub || !payload?.exp)
      throw new UnauthorizedException('Invalid payload');
    if (payload.exp * 1000 <= Date.now())
      throw new UnauthorizedException('Token expired');

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException('User is not active');

    // Attach full user and userId to request for downstream handlers
    req.user = user;
    return true;
  }
}
