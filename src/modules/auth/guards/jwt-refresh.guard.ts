import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = unknown>(err: unknown, user: unknown): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Refresh token inválido o expirado');
    }
    return user as TUser;
  }
}
