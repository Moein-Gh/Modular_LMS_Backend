import { PermissionsLoaderService } from '@app/application';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  private matchesPermission(userPerm: string, required: string): boolean {
    // simple wildcard matcher: segments separated by '/'
    if (required === '*/*' || userPerm === '*/*') return true;
    const up = userPerm.split('/');
    const rp = required.split('/');
    if (up.length !== rp.length) return false;
    for (let i = 0; i < up.length; i++) {
      if (up[i] === '*' || rp[i] === '*') continue;
      if (up[i] !== rp[i]) return false;
    }
    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler()) ?? [];

    if (!required.length) return true;

    const req = context.switchToHttp().getRequest<{
      user?: { id?: string; permissions?: string[] };
    }>();

    // If there's no authenticated user, deny access
    if (!req.user || !req.user.id) return false;

    // Load permissions on-demand if not attached by middleware
    if (!req.user.permissions) {
      try {
        const loader = this.moduleRef.get(PermissionsLoaderService, {
          strict: false,
        });
        if (loader) {
          req.user.permissions = await loader.getPermissions(req.user.id);
        } else {
          req.user.permissions = [];
        }
      } catch {
        req.user.permissions = [];
      }
    }

    const userPerms: string[] = req.user.permissions ?? [];
    if (!userPerms.length) return false;

    return required.every((r) =>
      userPerms.some((p) => this.matchesPermission(p, r)),
    );
  }
}
