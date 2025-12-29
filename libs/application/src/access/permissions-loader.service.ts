import {
  PERMISSION_GRANT_REPOSITORY,
  PERMISSION_REPOSITORY,
  ROLE_ASSIGNMENT_REPOSITORY,
  UserStatus,
} from '@app/domain';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

import type {
  Permission,
  PermissionGrant,
  PermissionGrantRepository,
  PermissionRepository,
  RoleAssignment,
  RoleAssignmentRepository,
} from '@app/domain';

/**
 * Loads permission keys for a user (role grants + direct grants).
 * Caches results per-user for a short TTL.
 */
@Injectable()
export class PermissionsLoaderService {
  private readonly ttlSeconds = 60; // adjust as needed

  constructor(
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly roleAssignmentRepo: RoleAssignmentRepository,
    @Inject(PERMISSION_GRANT_REPOSITORY)
    private readonly permissionGrantRepo: PermissionGrantRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepo: PermissionRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private cacheKey(userId: string) {
    return `perms:${userId}`;
  }

  async getPermissions(userId: string): Promise<string[]> {
    const key = this.cacheKey(userId);
    const cached = (await this.cacheManager.get<string[]>(key)) ?? null;
    if (cached) return cached;

    // find active role assignments for user
    const assignments = await this.roleAssignmentRepo.findAll({
      where: { userId, status: UserStatus.ACTIVE },
    });
    const roleIds = assignments
      .map((a: RoleAssignment) => a.roleId)
      .filter(Boolean);

    // find grants for user and roles
    type GrantCondition = {
      granteeType: string;
      granteeId: string | { in: string[] };
      isGranted: boolean;
    };
    const orConditions: GrantCondition[] = [
      { granteeType: 'user', granteeId: userId, isGranted: true },
    ];
    if (roleIds.length) {
      orConditions.push({
        granteeType: 'role',
        granteeId: { in: roleIds },
        isGranted: true,
      });
    }
    const where = { OR: orConditions };

    const grants = await this.permissionGrantRepo.findAll({ where });
    const permissionIds = Array.from(
      new Set(
        grants.map((g: PermissionGrant) => g.permissionId).filter(Boolean),
      ),
    );

    let keys: string[] = [];
    if (permissionIds.length) {
      const perms = await this.permissionRepo.findAll({
        where: { id: { in: permissionIds } },
      });
      keys = perms.map((p: Permission) => p.key);
    }

    await this.cacheManager.set(key, keys, this.ttlSeconds * 1000);
    return keys;
  }

  async invalidate(userId: string): Promise<void> {
    await this.cacheManager.del(this.cacheKey(userId));
  }
}
