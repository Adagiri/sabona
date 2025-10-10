import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { translateData } from 'src/helpers/translation.helper';
import { IGNORE_TRANSLATION } from '../decorators/ignore_translation.decorator';

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ignoreTranslation = this.reflector.getAllAndOverride<boolean>(IGNORE_TRANSLATION, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (ignoreTranslation) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const locale = request.headers['locale'] || 'en';

        return next.handle().pipe(
            map((data) => {
                return translateData(data, locale);
            }),
        );
    }
}
