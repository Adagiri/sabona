import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CancelCustomOrderRequestDTO {
    @ApiProperty({ description: 'Reason for cancellation' })
    @IsString()
    reason: string;

    @ApiProperty({ description: 'Should refund customer if paid', required: false })
    @IsOptional()
    @IsBoolean()
    refundCustomer?: boolean;
}
