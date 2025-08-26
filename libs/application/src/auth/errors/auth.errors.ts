import { AppError } from '../../errors/app-error';

export class SmsCodeInvalidError extends AppError {
  constructor() {
    super({
      code: 'SMS_CODE_INVALID',
      status: 400,
      title: 'Invalid or expired SMS code',
      detail: 'The SMS code is invalid or expired.',
    });
  }
}

export class SmsCodeAttemptsExceededError extends AppError {
  constructor() {
    super({
      code: 'SMS_CODE_ATTEMPTS_EXCEEDED',
      status: 429,
      title: 'SMS code attempts exceeded',
      detail: 'Maximum attempts for this SMS code exceeded.',
    });
  }
}

export class AuthSessionRevokedError extends AppError {
  constructor() {
    super({
      code: 'AUTH_SESSION_REVOKED',
      status: 401,
      title: 'Session revoked',
      detail: 'This session has been revoked.',
    });
  }
}

export class AuthSessionNotFoundError extends AppError {
  constructor() {
    super({
      code: 'AUTH_SESSION_NOT_FOUND',
      status: 404,
      title: 'Session not found',
      detail: 'Authentication session not found.',
    });
  }
}

export class RefreshTokenInvalidError extends AppError {
  constructor() {
    super({
      code: 'REFRESH_TOKEN_INVALID',
      status: 401,
      title: 'Invalid refresh token',
      detail: 'Refresh token is invalid or expired.',
    });
  }
}
