import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class DateSerializerInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next
            .handle()
            .pipe(
                map((data) =>
                    JSON.parse(
                        JSON.stringify(data, (_, value) => (value instanceof Date ? value.toISOString() : value)),
                    ),
                ),
            );
    }
}
