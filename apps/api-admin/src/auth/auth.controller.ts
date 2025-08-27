import {
  AuthService,
  LogoutDto,
  RegisterUserInput,
  RegisterUserUseCase,
  RequestSmsCodeDto,
  VerifySmsCodeDto,
} from '@app/application';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  Req,
  BadRequestException,
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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly registerUserUseCase: RegisterUserUseCase,
  ) {}

  @Post('register-user')
  @HttpCode(HttpStatus.CREATED)
  registerUser(@Body() body: RegisterUserInput) {
    return this.registerUserUseCase.execute(body);
  }

  @Post('request-sms')
  @HttpCode(HttpStatus.OK)
  requestSms(@Body() body: RequestSmsCodeDto) {
    return this.auth.requestSmsCode(body);
  }

  @Post('verify-sms')
  @HttpCode(HttpStatus.OK)
  async verifySms(
    @Body() body: VerifySmsCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.verifySmsCode(body);
    // Set tokens as httpOnly, secure cookies
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: result.accessTokenExpiresIn * 1000,
      path: '/',
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: result.refreshTokenExpiresIn * 1000,
      path: '/',
    });
    // Do not return tokens in body
    return { success: true, userId: result.userId };
  }

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
      secure: true,
      sameSite: 'lax',
      maxAge: result.accessTokenExpiresIn * 1000,
      path: '/',
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: result.refreshTokenExpiresIn * 1000,
      path: '/',
    });
    return { success: true, userId: result.userId };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: LogoutDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.logout(body);
    // Clear auth cookies
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return result;
  }
}
