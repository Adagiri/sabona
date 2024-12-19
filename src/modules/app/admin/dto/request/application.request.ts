import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import PaginatedRequest from '../../../../../core/request/paginated.request';

export enum ApplicantType {
  VENDOR = 'VENDOR',
  RIDER = 'RIDER',
};

export default class FindApplicationRequestDTO extends PaginatedRequest {
  @ApiPropertyOptional({ enum: ApplicantType })
  @IsEnum(ApplicantType)
  type: ApplicantType;
}
