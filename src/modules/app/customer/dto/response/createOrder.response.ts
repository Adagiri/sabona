import { ApiProperty } from '@nestjs/swagger';

class AssignedDriver {
    @ApiProperty()
    riderId: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ description: 'Distance in kilometers' })
    distance: number;
}

export default class CreateOrderResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    totalAmount: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ type: AssignedDriver, required: false, description: 'Assigned driver info (for regular orders)' })
    assignedDriver?: AssignedDriver;
}
