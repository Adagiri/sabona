import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsString } from "class-validator";


class AllTipsResponse {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsDate()
    createdAt: Date;

    @ApiProperty()
    @IsString()
    riderId: string;
}


export class AllTipsResponseDTO {
    @ApiProperty({ type: [AllTipsResponse] })
    data: AllTipsResponse[];

    @ApiProperty()
    count: number;
}   
