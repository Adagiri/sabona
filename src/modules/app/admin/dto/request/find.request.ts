import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import PaginatedRequest from '../../../../../core/request/paginated.request';
import { OrderStatus, OrderType } from '@prisma/client';

export default class FindOrderRequestDTO extends PaginatedRequest {
    @ApiPropertyOptional({ enum: OrderStatus })
    @IsOptional()
    @IsEnum(OrderStatus)
    type: OrderStatus;

    @ApiPropertyOptional({ enum: OrderType })
    @IsOptional()
    @IsEnum(OrderType)
    orderType?: OrderType;
}
