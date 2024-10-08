import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

class GetRideRequestsDTO {
    @ApiProperty()
    @IsString()
    id: string

    @ApiProperty()
    @IsString()
    userId: string

    @ApiProperty()
    @IsString()
    status: string

}

export default class GetRideRequestsResponseDTO {
    @ApiProperty({type: [GetRideRequestsDTO]})
    data: GetRideRequestsDTO[]
}