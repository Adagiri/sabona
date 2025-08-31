import { ApiProperty } from '@nestjs/swagger';

export class AdminSettingsDataDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    vatRate: number;

    @ApiProperty()
    vatEnabled: boolean;

    @ApiProperty()
    serviceChargeType: string;

    @ApiProperty()
    serviceChargeRate: number;

    @ApiProperty()
    customOrderServiceChargeRate: number;

    @ApiProperty()
    deliveryBaseRate: number;

    @ApiProperty()
    deliveryPerKmRate: number;

    @ApiProperty()
    freeDeliveryThreshold: number;

    @ApiProperty()
    expressMultiplier: number;

    @ApiProperty()
    maxDeliveryDistance: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class GetAdminSettingsResponseDTO {
    @ApiProperty()
    message: string;

    @ApiProperty({ type: AdminSettingsDataDTO })
    data: AdminSettingsDataDTO;
}
