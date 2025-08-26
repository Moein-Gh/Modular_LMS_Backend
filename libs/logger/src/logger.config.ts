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
              // Show only date and hour:minute, no seconds or timezone
              translateTime: 'yyyy-mm-dd HH:MM',
              // Remove timestamp and log level from pretty output
              ignore: 'pid,hostname,time,level,req,res,responseTime',
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
    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      return `\n——————————————————————————————————————————————————\n${yyyy}-${mm}-${dd} ${hh}:${min}  ✅ ${res.statusCode} ${req.method} ${req.url}\n——————————————————————————————————————————————————`;
    },
    redact: {
      paths: [
        // Remove verbose top-level pino-http objects from success logs
        'req',
        'res',
        'responseTime',
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
    customProps: () => {
      // Keep extra props minimal to avoid expanding logs.
      return {};
    },
  };

  return { pinoHttp: pinoOptions };
};
