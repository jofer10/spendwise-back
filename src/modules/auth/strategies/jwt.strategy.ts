import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('auth.jwtSecret') || 'fallback-secret',
    });
  }

  validate(payload: { sub: string; email: string; type?: string }): JwtPayload {
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Tipo de token inválido');
    }
    return {
      sub: payload.sub,
      email: payload.email,
      type: 'access',
    };
  }
}
