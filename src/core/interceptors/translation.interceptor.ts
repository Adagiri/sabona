import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { translateData } from 'src/helpers/translation.helper';

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const locale = request.headers['locale'] || 'en';

        return next.handle().pipe(
            map((data) => {
                return translateData(data, locale);
            }),
        );
    }
}
