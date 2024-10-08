import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsString } from "class-validator";

export default class EditAddressResponseDTO {
    @ApiProperty()
    @IsString()
    id: string

    @ApiProperty()
    @IsString()
    address: string
    
    @ApiProperty()
    @IsString()
    label: string

    @ApiProperty()
    @IsNumber()
    lat: number

    @ApiProperty()
    @IsNumber()
    long: number

    @ApiProperty()
    @IsBoolean()
    isDefault: boolean;

    
    

}