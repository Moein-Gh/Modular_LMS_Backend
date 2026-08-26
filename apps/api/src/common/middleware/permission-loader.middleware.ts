import { PermissionsLoaderService } from '@app/application';
import { UserWithPermissions } from '@app/domain';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class PermissionLoaderMiddleware implements NestMiddleware {
  constructor(private readonly loader: PermissionsLoaderService) {}

  async use(
    req: Request & { user?: UserWithPermissions },
    _res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user || !req.user.id) return next();
      if (!req.user.permissions) {
        // attach permissions array to req.user
        req.user.permissions = await this.loader.getPermissions(req.user.id);
      }
    } catch {
      // don't block request if permissions loading fails
      // log if you have a logger
      // console.warn('Permission loader failed', err);
    }
    return next();
  }
}
