import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export default class SendNotificationRequestDTO {
    @ApiProperty()
    @IsString()
    token: string;

    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    body: string;

}

export class MultipleDeviceNotificationDto {
    @ApiProperty()
    @IsArray()
    tokens: string[];

    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    body: string;

  
}
