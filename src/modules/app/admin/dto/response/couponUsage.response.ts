import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsArray, IsObject, IsBoolean, IsDate } from "class-validator";

// Order DTO
class OrderDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsNumber()
    totalAmount: number;

    @ApiProperty()
    @IsString()
    userId: string;

    @ApiProperty()
    @IsNumber()
    orderNumber: number;
}

// User DTO
class UserDTO {
    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsString()
    phone: string;
}

// Coupon DTO
class CouponDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    code: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ type: [OrderDTO] })
    @IsArray()
    orders?: OrderDTO[];
}

// class CouponDetailsDTO {
//     @ApiProperty()
//     @IsString()
//     id: string;

//     @ApiProperty()
//     @IsString()
//     code: string;

//     @ApiProperty()
//     @IsString()
//     name: string;
// }

// Coupon Usage DTO
class CouponUsageDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    userId: string;

    @ApiProperty({ type: UserDTO })
    user: UserDTO;

    @ApiProperty({ type: CouponDTO })
    coupon: CouponDTO;
}

class Coupon {
    @ApiProperty()
    @IsString()
    code: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsBoolean()
    isActive: boolean;

    @ApiProperty()
    @IsDate()
    expiryDate: Date;
}

// Paginated Response DTO
class CouponUsageResponseDTO {
    @ApiProperty({ type: [CouponUsageDTO] })
    @IsArray()
    usage: CouponUsageDTO[];

    @ApiProperty()
    @IsNumber()
    totalUsageCount: number;

    @ApiProperty()
    @IsNumber()
    count: number;

    @ApiProperty({type: Coupon})
    coupon: Coupon;
    // @ApiProperty()
    // coupon: {
    //     coupon: {
    //         id: string;
    //         code: string;
    //         name: string;
    //     }[]
    // }
}

export class CouponUsagePaginatedResponseDTO {
    @ApiProperty({ type: CouponUsageResponseDTO })
    data: CouponUsageResponseDTO;
}

