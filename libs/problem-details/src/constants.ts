import { HttpStatus } from '@nestjs/common';

export const PROBLEM_DETAILS_MEDIA_TYPE = 'application/problem+json';
export const DEFAULT_ERROR_TYPE = 'about:blank';
export const DEFAULT_ERROR_TITLE = 'Internal Server Error';
export const DEFAULT_ERROR_STATUS = HttpStatus.INTERNAL_SERVER_ERROR;
export const DEFAULT_ERROR_MESSAGE = 'An error occurred';
export const HTTP_STATUS_URL_PREFIX = 'https://httpstatuses.com/';
