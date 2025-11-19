import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

class LaundryServiceItem {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsNumber()
    vendorPrice: number;

    @ApiProperty()
    @IsNumber()
    platformPrice: number;

    @ApiProperty()
    @IsNumber()
    expressVendorPrice: number;

    @ApiProperty()
    @IsNumber()
    expressPlatformPrice: number;

    @ApiProperty({ description: 'Backward compatibility - same as expressVendorPrice' })
    @IsNumber()
    expressPrice: number;
}

class LaundryService {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty({ type: [LaundryServiceItem] })
    laundryServiceItems: LaundryServiceItem[];
}

class OrderServiceItem {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;

    @ApiProperty()
    @IsNumber()
    vendorPriceSnapshot: number;

    @ApiProperty()
    @IsNumber()
    platformPriceSnapshot: number;

    @ApiProperty()
    @IsNumber()
    expressVendorPriceSnapshot: number;

    @ApiProperty()
    @IsNumber()
    expressPlatformPriceSnapshot: number;

    @ApiProperty({ description: 'Backward compatibility - same as expressVendorPriceSnapshot' })
    @IsNumber()
    expressPriceSnapshot: number;

    @ApiProperty()
    @IsString()
    itemName: string;

    @ApiProperty()
    @IsString()
    serviceName: string;

    @ApiProperty({ type: LaundryServiceItem })
    laundryServiceItem: LaundryServiceItem;
}

class Laundry {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    address: string;

    @ApiProperty({ type: [LaundryService] })
    laundryService: LaundryService[];
}

class RiderOrder {
    @ApiProperty()
    @IsString()
    riderId: string;

    @ApiProperty()
    assignedAt: Date;
}

class StatusHistory {
    @ApiProperty()
    @IsString()
    status: string;

    @ApiProperty()
    timestamp: Date;
}

class Pickup {
    @ApiProperty()
    @IsString()
    riderId: string;

    @ApiProperty()
    @IsString()
    pickupAddress: string;

    @ApiProperty()
    pickupLat: number;

    @ApiProperty()
    pickupLong: number;

    @ApiProperty()
    @IsString()
    status: string;
}

class Delivery {
    @ApiProperty()
    @IsString()
    riderId: string;

    @ApiProperty()
    @IsString()
    deliveryAddress: string;

    @ApiProperty()
    deliveryLat: number;

    @ApiProperty()
    deliveryLong: number;

    @ApiProperty()
    @IsString()
    status: string;
}

class Service {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty({ type: [OrderServiceItem] })
    items: OrderServiceItem[];
}

export default class GetOrderByIdResponseDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    totalAmount: number;

    @ApiProperty()
    @IsString()
    status: string;

    @ApiProperty()
    @IsString()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    laundryId: string;

    @ApiProperty({ type: Laundry })
    laundry: Laundry;

    @ApiProperty({ type: [RiderOrder] })
    riderOrders: RiderOrder[];

    @ApiProperty({ type: [StatusHistory] })
    statusHistory: StatusHistory[];

    @ApiProperty({ type: Pickup })
    pickup: Pickup;

    @ApiProperty({ type: Delivery })
    delivery: Delivery;

    @ApiProperty({ type: [Service] })
    services: Service[];
}
