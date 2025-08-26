import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/infra/prisma/prisma.module';
import { ConfigService } from '@app/config';
import type { RequestSmsCodeDto } from './dtos/request-sms-code.dto';
import type { VerifySmsCodeDto } from './dtos/verify-sms-code.dto';
import type { RefreshTokenDto } from './dtos/refresh-token.dto';
import type { LogoutDto } from './dtos/logout.dto';
import type { AuthPayload } from '@app/domain/auth/entities/auth-payload.entity';
import * as crypto from 'crypto';
import { LogoutResult, RequestSmsCodeResult } from './dtos/auth.responses';
import { InvalidOrExpiredCodeError } from './errors/invalid-or-expired-code.error';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // 1. Request SMS code
  public async requestSmsCode(
    cmd: RequestSmsCodeDto,
  ): Promise<RequestSmsCodeResult> {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('---------------');
    console.log(`Sending SMS code ${code} to ${cmd.phone}`);
    console.log('---------------');
    // Save code to DB (prisma.smsCode)
    await this.prisma.smsCode.create({
      data: {
        phone: cmd.phone,
        code,
        purpose: cmd.purpose,
        attempts: 0,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      },
    });
    // TODO: Integrate with real SMS provider here
    // e.g. await this.smsProvider.send(cmd.phone, code);
    return { success: true, message: 'SMS code sent.' };
  }

  // 2. Verify SMS code and issue tokens
  public async verifySmsCode(cmd: VerifySmsCodeDto): Promise<AuthPayload> {
    // Find active code
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
    // Mark as consumed
    await this.prisma.smsCode.update({
      where: { id: sms.id },
      data: { consumedAt: new Date() },
    });

    // Find or create user/identity
    let identity = await this.prisma.identity.findUnique({
      where: { phone: cmd.phone },
    });
    if (!identity) {
      const user = await this.prisma.user.create({ data: {} });
      identity = await this.prisma.identity.create({
        data: { userId: user.id, phone: cmd.phone },
      });
    }

    // Create refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const refreshTokenExpiresIn = this.config.get('REFRESH_TOKEN_EXPIRES_IN')
      ? Number(this.config.get('REFRESH_TOKEN_EXPIRES_IN'))
      : 2592000; // fallback 30 days
    const accessTokenExpiresIn = this.config.get('ACCESS_TOKEN_EXPIRES_IN')
      ? Number(this.config.get('ACCESS_TOKEN_EXPIRES_IN'))
      : 900; // fallback 15 min
    await this.prisma.refreshToken.create({
      data: {
        userId: identity.userId,
        tokenHash,
        expiresAt: new Date(Date.now() + refreshTokenExpiresIn * 1000),
      },
    });

    // Create access token (JWT)
    const jwtSecret = this.config.get('JWT_SECRET') || 'dev_secret';
    const payload = { sub: identity.userId, phone: identity.phone };
    const accessToken = this.signJwt(payload, jwtSecret, accessTokenExpiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresIn,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      userId: identity.userId,
    };
  }

  // 3. Refresh tokens
  public async refresh(cmd: RefreshTokenDto): Promise<AuthPayload> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(cmd.refreshToken)
      .digest('hex');
    const session = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
    });
    if (!session) throw new Error('Invalid or expired refresh token');

    // Rotate refresh token
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');
    await this.prisma.refreshToken.update({
      where: { id: session.id },
      data: { revoked: true, revokedAt: new Date(), replacedByTokenId: null },
    });
    const refreshTokenExpiresIn = this.config.get('REFRESH_TOKEN_EXPIRES_IN')
      ? Number(this.config.get('REFRESH_TOKEN_EXPIRES_IN'))
      : 2592000;
    const accessTokenExpiresIn = this.config.get('ACCESS_TOKEN_EXPIRES_IN')
      ? Number(this.config.get('ACCESS_TOKEN_EXPIRES_IN'))
      : 900;
    await this.prisma.refreshToken.create({
      data: {
        userId: session.userId,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + refreshTokenExpiresIn * 1000),
      },
    });

    // Issue new access token
    const identity = await this.prisma.identity.findFirst({
      where: { userId: session.userId },
    });
    const jwtSecret = this.config.get('JWT_SECRET') || 'dev_secret';
    const payload = { sub: session.userId, phone: identity?.phone };
    const accessToken = this.signJwt(payload, jwtSecret, accessTokenExpiresIn);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: accessTokenExpiresIn,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      userId: session.userId,
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

  // Helper: sign JWT (minimal, replace with real lib in prod)
  private signJwt(payload: any, secret: string, expiresInSec: number): string {
    // This is a stub. Use @nestjs/jwt or jsonwebtoken in production.
    // Here, just base64-encode the payload for demo purposes.
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        exp: Math.floor(Date.now() / 1000) + expiresInSec,
      }),
    ).toString('base64url');
    const sig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${sig}`;
  }
}
