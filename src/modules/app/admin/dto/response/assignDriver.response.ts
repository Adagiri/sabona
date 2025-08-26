import { ApiProperty } from '@nestjs/swagger';

class DriverAssignmentData {
    @ApiProperty()
    assignmentId: string;

    @ApiProperty()
    orderId: string;

    @ApiProperty()
    riderId: string;

    @ApiProperty()
    driverName: string;

    @ApiProperty()
    phase: string; // 'PICKUP' or 'DELIVERY'
}

export class AssignDriverResponseDTO {
    @ApiProperty({ type: DriverAssignmentData })
    data: DriverAssignmentData;

    @ApiProperty()
    message: string;
}
