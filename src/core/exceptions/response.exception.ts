import { HttpException, HttpStatus } from "@nestjs/common";

export class NotFoundException extends HttpException {
  constructor(key: string = "common.errors.not_found", data?: any) {
    super({ key, data }, HttpStatus.NOT_FOUND);
  }
}
export class UnAuthorizedException extends HttpException {
  constructor(key: string = "common.errors.unauthorized", data?: any) {
    super({ key, data }, HttpStatus.UNAUTHORIZED);
  }
}
export class BadRequestException extends HttpException {
  constructor(key: string = "common.errors.bad_request", data?: any) {
    super({ key, data }, HttpStatus.BAD_REQUEST);
  }
}
export class ForbiddenException extends HttpException {
  constructor(key: string = "common.errors.forbidden", data?: any) {
    super({ key, data }, HttpStatus.FORBIDDEN);
  }
}
export class FatalErrorException extends HttpException {
  constructor(key: string = "common.errors.fatal", data?: any) {
    super({ key, data }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
