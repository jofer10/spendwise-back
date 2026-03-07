import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('auth.refreshSecret') || 'fallback-refresh-secret',
      passReqToCallback: true,
    } as any);
  }

  validate(
    req: Request,
    payload: { sub: string; email: string; type?: string },
  ): JwtPayload & { refreshToken: string } {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Tipo de token inválido');
    }
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token requerido');
    }
    return {
      sub: payload.sub,
      email: payload.email,
      type: 'refresh',
      refreshToken,
    };
  }
}
