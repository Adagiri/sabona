import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

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

class NotificationData {
    @ApiProperty()
    @IsString()
    @IsOptional()
    orderId?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    key?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    route?: string;


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

    @ApiProperty()
    @IsObject()
    @IsOptional()
    notificationData?: NotificationData;

  
}
