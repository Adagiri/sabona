import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

class getAllAddressesDTO {

    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    address: string;

    @ApiProperty()
    @IsNumber()
    lat: number;

    @ApiProperty()
    @IsNumber()
    long: number;

    @ApiProperty()
    @IsOptional()
    label?: string;

    @ApiProperty()
    isDefault?: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export default class getAllAddressesResponseDTO {
    @ApiProperty({ type: [getAllAddressesDTO] })
    data: getAllAddressesDTO[];
}