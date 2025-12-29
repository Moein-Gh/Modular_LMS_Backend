import {
  AuthService,
  LogoutDto,
  Public,
  RegisterUserUseCase,
  RequestSmsCodeDto,
  VerifySmsCodeDto,
} from '@app/application';
import { User } from '@app/domain';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

function getCookie(req: Request, name: string): string | undefined {
  const header = req.headers?.cookie ?? '';
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function isSecureRequest(req: Request): boolean {
  // True when server is behind HTTPS or reverse proxy sets x-forwarded-proto
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

interface AuthenticatedRequest extends Request {
  user?: User;
}

export type DeviceMetaType = {
  deviceId?: string;
  deviceName?: string;
  userAgent?: string;
  ip?: string;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly registerUserUseCase: RegisterUserUseCase,
  ) {}

  @Public()
  @Post('request-sms')
  @HttpCode(HttpStatus.OK)
  requestSms(@Body() body: RequestSmsCodeDto) {
    return this.auth.requestSmsCode(body);
  }

  @Public()
  @Post('verify-sms')
  @HttpCode(HttpStatus.OK)
  async verifySms(
    @Body() body: VerifySmsCodeDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const deviceId = req.headers['x-device-id'] ?? undefined;
    const deviceName = req.headers['x-device-name'] ?? undefined;
    const userAgent = req.headers['user-agent'] ?? undefined;
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        .trim() ?? req.ip;

    const deviceMeta: DeviceMetaType = {
      deviceId: deviceId as string | undefined,
      deviceName: deviceName as string | undefined,
      userAgent,
      ip,
    };
    const result = await this.auth.verifySmsCode(body, deviceMeta);

    const isCloudProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
      httpOnly: true,
      path: '/',
      secure: isCloudProduction, // False on your machine, True on AWS/Render
      sameSite: 'lax' as const, // 'Lax' works with secure: false
    };

    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: result.accessTokenExpiresIn * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: result.refreshTokenExpiresIn * 1000,
    });

    return {
      success: true,
      user: result.user,
      userId: result.userId,
      sessionId: result.sessionId,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = getCookie(req, 'refreshToken');
    if (!refreshToken) {
      throw new BadRequestException('Refresh token cookie not found');
    }
    const result = await this.auth.refresh(refreshToken);
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: 'lax',
      maxAge: result.accessTokenExpiresIn * 1000,
      path: '/',
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: 'lax',
      maxAge: result.refreshTokenExpiresIn * 1000,
      path: '/',
    });
    return {
      success: true,
      user: result.user,
      userId: result.userId,
      sessionId: result.sessionId,
    };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  currentUser(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new UnauthorizedException('User context not set');
    }
    return req.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId =
      (req.headers['x-device-id'] as string | undefined) ?? undefined;
    const result = await this.auth.logout(body, deviceId);
    // Clear auth cookies
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return result;
  }
}
