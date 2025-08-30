import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@app/config';
import type { RequestSmsCodeDto } from '../dtos/request-sms-code.dto';
import type { VerifySmsCodeDto } from '../dtos/verify-sms-code.dto';
import type { LogoutDto } from '../dtos/logout.dto';
import * as crypto from 'crypto';
import { LogoutResult, RequestSmsCodeResult } from '../dtos/auth.responses';
import { InvalidOrExpiredCodeError } from '../errors/invalid-or-expired-code.error';
import { AccessToken, DomainPayload, RefreshToken } from '@app/domain';
import { IdentityService } from './identity.service';
import { NotFoundError } from '@app/application/errors/not-found.error';
import { UsersService } from '@app/application/user/services/users.service';
import { PrismaService } from '@app/infra/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly identityService: IdentityService,
    private readonly usersService: UsersService,
  ) {}

  // 1. Request SMS code
  public async requestSmsCode(
    cmd: RequestSmsCodeDto,
  ): Promise<RequestSmsCodeResult> {
    // Find identity by phone number
    const identity = await this.identityService.findByPhone(cmd.phone);
    if (!identity) {
      throw new NotFoundError('Identity', 'phone number', cmd.phone);
    }
    const user = await this.usersService.findByIdentityId(identity.id);
    if (!user) {
      throw new NotFoundError('User', 'identity ID', identity.id);
    }
    if (!user.isActive) {
      throw new BadRequestException('User is not active');
    }

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
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
  public async verifySmsCode(cmd: VerifySmsCodeDto): Promise<DomainPayload> {
    const identity = await this.identityService.findByPhone(cmd.phone);
    if (!identity) {
      throw new NotFoundError('Identity', 'phone number', cmd.phone);
    }

    const user = await this.usersService.findByIdentityId(identity.id);
    if (!user) {
      throw new NotFoundError('User', 'identity ID', identity.id);
    }
    if (!user.isActive) {
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

    // Create refresh token value object
    const refreshTokenExpiresIn = Number(
      this.config.get('REFRESH_TOKEN_EXPIRES_IN') ?? 2592000,
    );
    const accessTokenExpiresIn = Number(
      this.config.get('ACCESS_TOKEN_EXPIRES_IN') ?? 900,
    );
    const refreshTokenVO = RefreshToken.create(refreshTokenExpiresIn);
    await this.prisma.refreshToken.create({
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

    return {
      accessToken: accessTokenVO.value,
      refreshToken: refreshTokenVO.value,
      expiresIn: accessTokenExpiresIn,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      userId: user.id,
    };
  }

  // 3. Refresh tokens
  public async refresh(refreshToken: string): Promise<DomainPayload> {
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
    if (!session) throw new Error('Invalid or expired refresh token');

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
    await this.prisma.refreshToken.create({
      data: {
        userId: session.userId,
        tokenHash: newRefreshTokenVO.hash,
        expiresAt: newRefreshTokenVO.expiresAt,
      },
    });

    // Issue new access token value object
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: { identity: true },
    });
    if (!user) {
      throw new Error('User not found');
    }
    const jwtSecret = this.config.get('JWT_SECRET') || 'dev_secret';
    const payload = { sub: user.id, phone: user.identity?.phone };
    const accessTokenVO = AccessToken.create(
      payload,
      jwtSecret,
      accessTokenExpiresIn,
    );

    return {
      accessToken: accessTokenVO.value,
      refreshToken: newRefreshTokenVO.value,
      expiresIn: accessTokenExpiresIn,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      userId: user.id,
    };
  }

  // 4. Logout (revoke refresh token)
  public async logout(cmd: LogoutDto): Promise<LogoutResult> {
    await this.prisma.refreshToken.update({
      where: { id: cmd.sessionId },
      data: { revoked: true, revokedAt: new Date() },
    });
    return { success: true };
  }

  // Token logic is now encapsulated in value objects
}
