import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import PaginatedRequest from '../../../../../core/request/paginated.request';
import { OrderStatus } from '@prisma/client';

export default class FindOrderRequestDTO extends PaginatedRequest {
    @ApiPropertyOptional({ enum: OrderStatus })
    @IsOptional()
    @IsEnum(OrderStatus)
    type: OrderStatus;
}
