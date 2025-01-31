import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import PaginatedRequest from "src/core/request/paginated.request";

export enum coupon {
    ACTIVE= 'ACTIVE',
    USED= 'USED',
    EXPIRED= 'EXPIRED',

}

export class getUserCouponsQueryDTO extends PaginatedRequest{
    @ApiProperty({
        description: 'ACTIVE, USED or EXPIRED',
    })
    @IsEnum(coupon)
    couponFilter: coupon;
}