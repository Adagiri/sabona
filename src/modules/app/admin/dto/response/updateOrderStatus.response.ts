import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusResponseDTO {
    @ApiProperty()
    message: string;

    @ApiProperty({ required: false })
    data?: {
        orderId: string;
        status: string;
        updatedAt: Date;
    };
}

export class AddOrderNotesResponseDTO {
    @ApiProperty()
    message: string;

    @ApiProperty({ required: false })
    data?: {
        orderId: string;
        notes: string;
        addedBy: string;
        addedAt: Date;
    };
}
