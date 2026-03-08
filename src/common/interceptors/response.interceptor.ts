import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

const WRAPPED_PATHS = ['/api/accounts', '/api/categories', '/api/transactions'];

function shouldWrap(path: string): boolean {
  return WRAPPED_PATHS.some((p) => path.startsWith(p));
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    if (!shouldWrap(request.url)) {
      return next.handle();
    }

    return next.handle().pipe(
      map((result) => ({
        success: true,
        message: null,
        data: result ?? null,
      })),
    );
  }
}
