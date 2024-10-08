import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

class OrdersDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    @IsNumber()
    userId: string;

    @ApiProperty()
    @IsString()
    status: string;

    @ApiProperty()
    @IsNumber()
    totalAmount: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export default class GetAllCustomerOrdersResponseDTO {
    @ApiProperty({ type: [OrdersDTO] })
    data: OrdersDTO[];
}
