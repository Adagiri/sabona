import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class CreateLaundryServiceItemRequestDTO {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    price: number;
}

export class CreateLaundryServiceItemsArrayDTO {
    @ApiProperty({ type: [CreateLaundryServiceItemRequestDTO] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateLaundryServiceItemRequestDTO)
    items: CreateLaundryServiceItemRequestDTO[];
  }

