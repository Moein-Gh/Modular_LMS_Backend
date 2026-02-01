import { NotFoundError } from '@app/application/errors/not-found.error';
import { UsersService } from '@app/application/user/services/users.service';
import { ConfigService } from '@app/config';
import {
  AccessToken,
  MessageType,
  Payload,
  RecipientStatus,
  RefreshToken,
  UserStatus,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { MessagingService } from '../../messaging/services/messaging.service';
import { LogoutResult, RequestSmsCodeResult } from '../dtos/auth.responses';
import type { LogoutDto } from '../dtos/logout.dto';
import type { RequestSmsCodeDto } from '../dtos/request-sms-code.dto';
import type { VerifySmsCodeDto } from '../dtos/verify-sms-code.dto';
import { InvalidOrExpiredCodeError } from '../errors/invalid-or-expired-code.error';
import { DevicesService } from './devices.service';
import { IdentitiesService } from './identities.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly identityService: IdentitiesService,
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly messagingService: MessagingService,
  ) {}

  // 1. Request SMS code
  public async requestSmsCode(
    cmd: RequestSmsCodeDto,
  ): Promise<RequestSmsCodeResult> {
    // Find identity by phone number
    const identity = await this.identityService.findOne({ phone: cmd.phone });
    if (!identity) {
      throw new NotFoundError('کاربر', 'شماره تلفن', cmd.phone);
    }
    const user = await this.usersService.findByIdentityId(identity.id);
    if (!user) {
      throw new NotFoundError('کاربر', 'شناسه', identity.id);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('کاربر فعال نیست');
    }

    // Generate a random 6-digit code
    // const code = Math.floor(100000 + Math.random() * 900000).toString();
    const code = '123456'; // TODO: Remove hardcoded code for testing only
    console.log('---------------');
    console.log(`Sending SMS code ${code} to ${cmd.phone}`);
    console.log('---------------');

    const SMS_CODE_EXPIRES_IN = this.config.get('SMS_CODE_EXPIRES_IN')
      ? Number(this.config.get('SMS_CODE_EXPIRES_IN'))
      : 300;
    // Add SMS code to DB
    await this.prisma.smsCode.create({
      data: {
        phone: cmd.phone,
        code,
        purpose: cmd.purpose,
        attempts: 0,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() + SMS_CODE_EXPIRES_IN * 1000),
      },
    });
    // TODO: Integrate with real SMS provider here
    // e.g. await this.smsProvider.send(cmd.phone, code);
    return { success: true, message: 'SMS code sent.' };
  }

  // 2. Verify SMS code and issue tokens
  public async verifySmsCode(
    cmd: VerifySmsCodeDto,
    deviceMeta?: {
      deviceId?: string;
      deviceName?: string;
      userAgent?: string;
      ip?: string;
    },
  ): Promise<Payload> {
    const identity = await this.identityService.findOne({ phone: cmd.phone });
    if (!identity) {
      throw new NotFoundError('Identity', 'phone number', cmd.phone);
    }

    const user = await this.usersService.findByIdentityId(identity.id);
    if (!user) {
      throw new NotFoundError('User', 'identity ID', identity.id);
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('User is not active');
    }

    const sms = await this.prisma.smsCode.findFirst({
      where: {
        phone: cmd.phone,
        code: cmd.code,
        purpose: cmd.purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: 5 },
      },
    });

    if (!sms) {
      throw new InvalidOrExpiredCodeError();
    }
    // Delete SMS code
    await this.prisma.smsCode.delete({
      where: { id: sms.id },
    });

    if (deviceMeta?.deviceId) {
      try {
        const { deviceId, deviceName, userAgent, ip } = deviceMeta;
        const existing = await this.devicesService.findByDeviceId(deviceId);
        if (existing) {
          if (existing.userId === user.id) {
            await this.devicesService.update(existing.id, {
              lastSeen: new Date(),
              userAgent: userAgent ?? existing.userAgent,
              ip: ip ?? existing.ip,
              deviceName: deviceName ?? existing.deviceName,
            });
          } else {
            await this.devicesService.create({
              lastSeen: new Date(),
              deviceId: deviceId,
              userId: user.id,
              deviceName: deviceName ?? null,
              userAgent: userAgent ?? null,
              ip: ip ?? null,
              revoked: false,
            });
          }
        } else {
          await this.devicesService.create({
            deviceId: deviceId,
            lastSeen: new Date(),
            userId: user.id,
            deviceName: deviceName ?? null,
            userAgent: userAgent ?? null,
            ip: ip ?? null,
            revoked: false,
          });
        }
      } catch (e) {
        console.warn('Device tracking failed', e);
      }
    }

    // Create refresh token value object
    const refreshTokenExpiresIn = Number(
      this.config.get('REFRESH_TOKEN_EXPIRES_IN') ?? 2592000,
    );
    const accessTokenExpiresIn = Number(
      this.config.get('ACCESS_TOKEN_EXPIRES_IN') ?? 900,
    );
    const refreshTokenVO = RefreshToken.create(refreshTokenExpiresIn);
    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenVO.hash,
        expiresAt: refreshTokenVO.expiresAt,
      },
    });

    // Create access token value object
    const jwtSecret = this.config.get('JWT_SECRET') || 'dev_secret';
    const payload = { sub: user.id, phone: identity.phone };
    const accessTokenVO = AccessToken.create(
      payload,
      jwtSecret,
      accessTokenExpiresIn,
    );

    const unreadCount = await this.messagingService.count({
      type: MessageType.PUSH_NOTIFICATION,
      recipients: {
        some: {
          userId: user.id,
          status: { not: RecipientStatus.READ },
        },
      },
      isDeleted: false,
    });

    return {
      accessToken: accessTokenVO.value,
      refreshToken: refreshTokenVO.value,
      expiresIn: accessTokenExpiresIn,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      userId: user.id,
      user,
      sessionId: refreshTokenRecord.id,
      isDeleted: false,
      hasUnreadPushNotifications: unreadCount > 0,
    };
  }

  // 3. Refresh tokens
  public async refresh(refreshToken: string): Promise<Payload> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
    });
    if (!session)
      throw new UnauthorizedException('Invalid or expired refresh token');

    // Rotate refresh token using value object
    const refreshTokenExpiresIn = this.config.get('REFRESH_TOKEN_EXPIRES_IN')
      ? Number(this.config.get('REFRESH_TOKEN_EXPIRES_IN'))
      : 2592000;
    const accessTokenExpiresIn = this.config.get('ACCESS_TOKEN_EXPIRES_IN')
      ? Number(this.config.get('ACCESS_TOKEN_EXPIRES_IN'))
      : 900;

    const newRefreshTokenVO = RefreshToken.create(refreshTokenExpiresIn);
    await this.prisma.refreshToken.update({
      where: { id: session.id },
      data: { revoked: true, revokedAt: new Date(), replacedByTokenId: null },
    });
    const newRefreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: session.userId,
        tokenHash: newRefreshTokenVO.hash,
        expiresAt: newRefreshTokenVO.expiresAt,
      },
    });

    // Issue new access token value object
    const user = await this.usersService.findById(session.userId);
    const jwtSecret = this.config.get('JWT_SECRET') || 'dev_secret';
    const payload = { sub: user.id, phone: user.identity?.phone };
    const accessTokenVO = AccessToken.create(
      payload,
      jwtSecret,
      accessTokenExpiresIn,
    );

    const unreadCount = await this.messagingService.count({
      type: MessageType.PUSH_NOTIFICATION,
      recipients: {
        some: {
          userId: user.id,
          status: { not: RecipientStatus.READ },
        },
      },
      isDeleted: false,
    });

    return {
      accessToken: accessTokenVO.value,
      refreshToken: newRefreshTokenVO.value,
      expiresIn: accessTokenExpiresIn,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      userId: user.id,
      user,
      sessionId: newRefreshTokenRecord.id,
      isDeleted: false,
      hasUnreadPushNotifications: unreadCount > 0,
    };
  }

  // 4. Logout (revoke refresh token)
  public async logout(
    cmd: LogoutDto,
    deviceId?: string,
  ): Promise<LogoutResult> {
    // Read session to determine the user (if exists)
    const session = await this.prisma.refreshToken.findUnique({
      where: { id: cmd.sessionId },
    });

    await this.prisma.refreshToken.update({
      where: { id: cmd.sessionId },
      data: { revoked: true, revokedAt: new Date() },
    });

    // If a deviceId was provided, mark the device as revoked (not active)
    if (deviceId && session?.userId) {
      try {
        const device = await this.devicesService.findByDeviceId(deviceId);
        if (device && device.userId === session.userId) {
          await this.devicesService.update(device.id, { revoked: true });
        }
      } catch (e) {
        console.warn('Failed to revoke device on logout', e);
      }
    }

    return { success: true };
  }

  // Token logic is now encapsulated in value objects
}
