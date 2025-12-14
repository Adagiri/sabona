import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusRequestDTO {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsEnum(OrderStatus)
    @IsNotEmpty()
    status: OrderStatus;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateDriverActionRequestDTO {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsEnum(['ACCEPT_PICKUP', 'PICKED_UP', 'DROPPED_AT_VENDOR', 'ACCEPT_DELIVERY', 'DELIVERED'])
    @IsNotEmpty()
    action: 'ACCEPT_PICKUP' | 'PICKED_UP' | 'DROPPED_AT_VENDOR' | 'ACCEPT_DELIVERY' | 'DELIVERED';

    @IsString()
    @IsOptional()
    notes?: string;
}

export class AddOrderNotesRequestDTO {
    @IsString()
    @IsNotEmpty()
    notes: string;
}
