import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from 'nestjs-i18n';
import { LocaleTranslation } from 'src/i18n';
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    constructor(private readonly i18n: I18nService) {}

    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> | Promise<Observable<any>> {
        const ctx = context.switchToHttp();
        const response: any = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const locale = request.headers['locale'];
        return next.handle().pipe(
            map((data: any) => {
                if (data.Message && data.Message instanceof LocaleTranslation) {
                    data = {
                        ...data,
                        Message: this.i18n.translate(data.Message.getKey(), {
                            args: data.Message.getData(),
                            lang: locale,
                        }),
                    };
                }
                response.__ss_body = { ...data };
                return data;
            }),
        );
    }
}
