import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import PaginatedRequest from '../../../../../core/request/paginated.request';
import { DateFilter } from 'src/helpers/util.helper';

export default class FindUsersRequestDTO extends PaginatedRequest {
    @ApiPropertyOptional({ enum: UserType })
    @IsEnum(UserType)
    type: UserType;

    @ApiPropertyOptional({ enum: DateFilter })
    @IsOptional()
    @IsEnum(DateFilter)
    dateFilter: DateFilter;
}
