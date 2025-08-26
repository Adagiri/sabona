import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateCustomOrderPricingRequestDTO {
    @ApiProperty({ description: 'Admin service charge for custom order' })
    @IsNumber()
    @Min(0)
    adminServiceCharge: number;

    @ApiProperty({ description: 'Total amount customer will pay' })
    @IsNumber()
    @Min(10, { message: 'Minimum total amount is 10 SAR' })
    totalAmount: number;
}
