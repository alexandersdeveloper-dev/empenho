import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Perfil } from '@ficha-empenho/shared';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Perfil => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
