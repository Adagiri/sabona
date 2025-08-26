import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '@prisma/client';

class AssignedOrderItem {
    @ApiProperty()
    quantity: number;

    @ApiProperty()
    laundryServiceItem: {
        name: string;
        platformPrice: number;
    };
}

class AssignedOrderService {
    @ApiProperty({ type: [AssignedOrderItem] })
    items: AssignedOrderItem[];
}

class AssignedOrderLaundry {
    @ApiProperty()
    name: string;

    @ApiProperty()
    address: string;

    @ApiProperty()
    lat: number;

    @ApiProperty()
    long: number;
}

class AssignedOrderPickup {
    @ApiProperty()
    pickupAddress: string;

    @ApiProperty()
    pickupLat: number;

    @ApiProperty()
    pickupLong: number;

    @ApiProperty()
    status: string;

    @ApiProperty()
    pickupDate: string;

    @ApiProperty()
    pickupTime: string;
}

class AssignedOrderDelivery {
    @ApiProperty()
    deliveryAddress: string;

    @ApiProperty()
    deliveryLat: number;

    @ApiProperty()
    deliveryLong: number;

    @ApiProperty()
    status: string;

    @ApiProperty({ required: false })
    deliveryDate?: string;
}

class AssignedOrderUser {
    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    phone: string;
}

class AssignedOrder {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: OrderType })
    orderType: OrderType;

    @ApiProperty()
    status: string;

    @ApiProperty()
    totalAmount: number;

    @ApiProperty({ required: false })
    customLaundryName?: string;

    @ApiProperty({ required: false })
    customLaundryDescription?: string;

    @ApiProperty({ required: false })
    customLaundryLat?: number;

    @ApiProperty({ required: false })
    customLaundryLong?: number;

    @ApiProperty({ type: AssignedOrderUser })
    user: AssignedOrderUser;

    @ApiProperty({ type: AssignedOrderLaundry, required: false })
    laundry?: AssignedOrderLaundry;

    @ApiProperty({ type: [AssignedOrderService], required: false })
    services?: AssignedOrderService[];

    @ApiProperty({ type: AssignedOrderPickup })
    pickup: AssignedOrderPickup;

    @ApiProperty({ type: AssignedOrderDelivery })
    delivery: AssignedOrderDelivery;
}

class RiderAssignment {
    @ApiProperty()
    assignmentId: string;

    @ApiProperty()
    assignmentType: string; // 'RIDER_PICKUP' or 'RIDER_DELIVERY'

    @ApiProperty()
    assignedAt: Date;

    @ApiProperty({ required: false })
    distanceToPickup?: number;

    @ApiProperty({ type: AssignedOrder })
    order: AssignedOrder;
}

export default class GetRideRequestsResponseDTO {
    @ApiProperty({ type: [RiderAssignment] })
    data: RiderAssignment[];
}
