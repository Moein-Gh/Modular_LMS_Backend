import {
  AuthService,
  LogoutDto,
  Public,
  RegisterUserUseCase,
  RequestSmsCodeDto,
  VerifySmsCodeDto,
} from '@app/application';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
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
  ) {
    const result = await this.auth.verifySmsCode(body);

    // LOGIC:
    // 1. If NODE_ENV is explicitly 'production' (Cloud), use Secure.
    // 2. Otherwise (Localhost, Ngrok, Docker, WiFi), use Non-Secure.
    // This allows the cookie to work on http://192... AND https://ngrok...
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
      userId: result.userId,
      sessionId: result.sessionId,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.logout(body);
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
