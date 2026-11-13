import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessRuleException extends HttpException {
  constructor(code: string, message: string) {
    super({ code, message }, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
