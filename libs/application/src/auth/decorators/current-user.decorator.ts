import { User } from '@app/domain';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUserId extends Request {
  user?: User;
}

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUserId>();
    return request.user?.id;
  },
);
