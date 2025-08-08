import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage, ServerResponse } from 'http';
import type { Params } from 'nestjs-pino';
import type { Options as PinoHttpOptions, ReqId } from 'pino-http';

// Extend only with our custom user field
declare module 'http' {
  interface IncomingMessage {
    user?: {
      id?: string;
      tenantId?: string;
    };
  }
}

type PinoHttpOptionsWithAls = PinoHttpOptions & {
  useAsyncLocalStorage?: boolean;
};

export const REQUEST_ID_HEADER = 'x-request-id';

export const createLoggerConfig = (): Params => {
  const pinoOptions: PinoHttpOptionsWithAls = {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    useAsyncLocalStorage: true,
    genReqId: (req: IncomingMessage, res: ServerResponse): ReqId => {
      const incoming = req.headers[REQUEST_ID_HEADER];
      if (typeof incoming === 'string') return incoming;
      if (Array.isArray(incoming) && incoming.length > 0) return incoming[0];

      const newId = uuidv4();
      res.setHeader(REQUEST_ID_HEADER, newId);
      return newId;
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers.cookies',
        'req.body.password',
        'req.body.token',
        'req.body.accessToken',
        'req.body.refreshToken',
        'res.headers["set-cookie"]',
      ],
      remove: true,
    },
    autoLogging: {
      ignore: (req: IncomingMessage) => {
        const ignorePaths = ['/health', '/docs', '/swagger', '/reference'];
        return ignorePaths.some((path) => (req.url ?? '').startsWith(path));
      },
    },
    customProps: (req: IncomingMessage) => {
      const idVal = (req as IncomingMessage & { id?: unknown }).id;
      const requestId =
        typeof idVal === 'string' || typeof idVal === 'number'
          ? String(idVal)
          : undefined;

      return {
        service: process.env.SERVICE_NAME || 'lms-backend',
        env: process.env.NODE_ENV || 'development',
        requestId,
        userId: (req as IncomingMessage & { user?: { id?: string } }).user?.id,
        tenantId: (req as IncomingMessage & { user?: { tenantId?: string } })
          .user?.tenantId,
      };
    },
  };

  return { pinoHttp: pinoOptions };
};
