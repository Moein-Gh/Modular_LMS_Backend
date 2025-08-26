import {
  AuthService,
  LogoutDto,
  RefreshTokenDto,
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
} from '@nestjs/common';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.refresh(body);
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
