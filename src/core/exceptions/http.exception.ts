import { ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';

const LOCALE_HEADER_KEY = 'locale';
function _prepareBadRequestValidationErrors(errors: any) {
    const Errors: any = {};
    for (const err of errors) {
        const constraint =
            err.constraints &&
            Object.values(err.constraints) &&
            Object.values(err.constraints).length &&
            Object.values(err.constraints)[0];
        Errors[err.property] = constraint
            ? constraint
            : this.i18n.translate('errors.field_invalid', {
                  args: { field: err.property },
                  lang: errors.lang,
              });
    }
    return Errors;
}



@Catch(HttpException, Error)
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly i18n: I18nService) {}

    catch(exception: HttpException | Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const locale = request.headers[LOCALE_HEADER_KEY] as string;

        // ✅ Prevent double responses
        if (response.headersSent) {
            console.warn('[HttpExceptionFilter] Headers already sent — skipping response write.');
            return;
        }

        try {
            // Handle non-HttpException errors
            if (!(exception instanceof HttpException)) {
                const ResponseToSend = {
                    message: this.i18n.translate('errors.fatal', { lang: locale }),
                };
                (response as any).__ss_body = ResponseToSend;
                return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(ResponseToSend);
            }

            const status = exception.getStatus();
            const exceptionResponse: any = exception.getResponse();

            // Handle validation errors
            if (
                exception instanceof BadRequestException &&
                exceptionResponse.message &&
                Array.isArray(exceptionResponse.message)
            ) {
                const ResponseToSend = {
                    message: this.i18n.translate('errors.invalid_values', {
                        args: {
                            values: exceptionResponse.message.map((x) => x.property).join(', '),
                        },
                        lang: locale,
                    }),
                    errors: _prepareBadRequestValidationErrors(exceptionResponse.message),
                };
                (response as any).__ss_body = ResponseToSend;
                return response.status(status).json(ResponseToSend);
            }

            // Default error handling
            const ResponseToSend = {
                message: this.i18n.translate(exceptionResponse.key || 'errors.unindentified', {
                    lang: locale,
                    args: exceptionResponse.data,
                }),
                data: exceptionResponse?.data || undefined,
            };
            (response as any).__ss_body = ResponseToSend;
            return response.status(status).json(ResponseToSend);
        } catch (err) {
            console.error('[HttpExceptionFilter] Error while sending error response:', err);

            // If still safe, send fallback
            if (!response.headersSent) {
                response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
            }
        }
    }
}

