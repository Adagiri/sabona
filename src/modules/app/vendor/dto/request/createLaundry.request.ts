import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";


export class LaundryServiceDTO {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    description: string;
}

export default class CreateLaundryRequestDTO {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    address: string;

    @ApiProperty({ type: [LaundryServiceDTO]})
    @Type(() => LaundryServiceDTO)
    @IsOptional()
    services: LaundryServiceDTO[];
}