import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export default class addCustomerAddressRequestDTO {
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
    @IsOptional()
    isDefault?: boolean;
}