import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    BadRequestException,
    HttpStatus,
    Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TranslatorService } from 'nestjs-translator';

const LOCALE_HEADER_KEY = 'locale';

function _prepareBadRequestValidationErrors(errors) {
    const Errors: any = {};
    for (const err of errors) {
        const constraint =
            err.constraints &&
            Object.values(err.constraints) &&
            Object.values(err.constraints).length &&
            Object.values(err.constraints)[0];
        Errors[err.property] = constraint ? constraint : `${err.property} is invalid`;
    }
    return Errors;
}
@Catch(HttpException, Error)
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(@Inject(TranslatorService) private _translatorService: TranslatorService) {}

    catch(exception: HttpException | Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response: any = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const locale = request.headers[LOCALE_HEADER_KEY] as string;
        if (!(exception instanceof HttpException)) {
            const ResponseToSend = {
                message: this._translatorService.translate('errors.fatal', { lang: locale }),
            };
            response.__ss_body = ResponseToSend;
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(ResponseToSend);
            return;
        }
        const status = exception.getStatus();
        const exceptionResponse: any = exception.getResponse();
        if (
            exception instanceof BadRequestException &&
            exceptionResponse.message &&
            Array.isArray(exceptionResponse.message)
        ) {
            const ResponseToSend = {
                message: this._translatorService.translate('errors.invalid_values', {
                    replace: {
                        values: exceptionResponse.message.map((x) => x.property).join(', '),
                    },
                    lang: locale,
                }),
                errors: _prepareBadRequestValidationErrors(exceptionResponse.message),
            };
            response.__ss_body = ResponseToSend;
            response.status(status).json(ResponseToSend);
        } else {
            const ResponseToSend = {
                message: this._translatorService.translate(
                    exceptionResponse.key || 'errors.unindentified',
                    {
                        lang: locale,
                        replace: exceptionResponse.data,
                    },
                ),
                data: exceptionResponse?.data || undefined,
            };
            response.__ss_body = ResponseToSend;
            response.status(status).json(ResponseToSend);
        }
    }
}
