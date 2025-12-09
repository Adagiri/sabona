import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { UserType } from '@prisma/client';

export default class AdminBroadcastNotificationRequestDTO {
    @ApiProperty({
        description: 'Notification title in English',
        example: 'Special Offer',
    })
    @IsString()
    titleEn: string;

    @ApiProperty({
        description: 'Notification body in English',
        example: 'Get 20% off on your next order!',
    })
    @IsString()
    bodyEn: string;

    @ApiProperty({
        description: 'Notification title in Arabic',
        example: 'عرض خاص',
    })
    @IsString()
    titleAr: string;

    @ApiProperty({
        description: 'Notification body in Arabic',
        example: 'احصل على خصم 20% على طلبك التالي!',
    })
    @IsString()
    bodyAr: string;

    @ApiProperty({
        description: 'Action type for deep linking',
        enum: ['ORDERS', 'PROFILE', 'HOME', 'PROMOTIONS'],
        example: 'ORDERS',
        required: false,
    })
    @IsOptional()
    @IsIn(['ORDERS', 'PROFILE', 'HOME', 'PROMOTIONS'])
    actionType?: string;

    @ApiProperty({
        description: 'Route to navigate to in the app',
        example: 'Orders',
        required: false,
    })
    @IsOptional()
    @IsString()
    route?: string;

    // Filters
    @ApiProperty({
        description: 'Filter by user types (USER, VENDOR, RIDER). If empty, sends to all active users',
        enum: UserType,
        isArray: true,
        required: false,
        example: ['USER'],
    })
    @IsOptional()
    @IsArray()
    @IsEnum(UserType, { each: true })
    userTypes?: UserType[];

    @ApiProperty({
        description: 'Filter by registration start date (ISO 8601)',
        example: '2024-01-01T00:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    registrationStartDate?: string;

    @ApiProperty({
        description: 'Filter by registration end date (ISO 8601)',
        example: '2024-12-31T23:59:59Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    registrationEndDate?: string;

    @ApiProperty({
        description: 'Minimum number of orders placed by user',
        example: 1,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    minOrderCount?: number;

    @ApiProperty({
        description: 'Maximum number of orders placed by user',
        example: 100,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    maxOrderCount?: number;
}
