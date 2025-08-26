import { ApiProperty } from '@nestjs/swagger';

class CustomOrderStatsData {
    @ApiProperty({ description: 'Number of pending custom orders' })
    pending: number;

    @ApiProperty({ description: 'Number of custom orders in progress' })
    inProgress: number;

    @ApiProperty({ description: 'Number of custom orders completed this month' })
    completedThisMonth: number;

    @ApiProperty({ description: 'Total number of custom orders' })
    total: number;
}

export class GetCustomOrderStatsResponseDTO {
    @ApiProperty({ type: CustomOrderStatsData })
    data: CustomOrderStatsData;
}
