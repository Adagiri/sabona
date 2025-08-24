import { ApiProperty } from '@nestjs/swagger';

class CustomOrderUser {
    @ApiProperty()
    id: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    email: string;
}

class CustomOrderPickup {
    @ApiProperty()
    pickupAddress: string;

    @ApiProperty()
    pickupLat: number;

    @ApiProperty()
    pickupLong: number;

    @ApiProperty()
    pickupDate: string;

    @ApiProperty()
    pickupTime: string;
}

class CustomOrderDelivery {
    @ApiProperty()
    deliveryAddress: string;

    @ApiProperty()
    deliveryLat: number;

    @ApiProperty()
    deliveryLong: number;

    @ApiProperty({ required: false })
    deliveryDate?: string;
}

class AssignedRider {
    @ApiProperty()
    id: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    phone: string;
}

class CustomOrderRiderAssignment {
    @ApiProperty()
    type: string; // 'RIDER_PICKUP' or 'RIDER_DELIVERY'

    @ApiProperty({ type: AssignedRider })
    rider: AssignedRider;

    @ApiProperty()
    assignedAt: Date;
}

export class CustomOrder {
    @ApiProperty()
    id: string;

    @ApiProperty()
    orderNumber: number;

    @ApiProperty()
    status: string;

    @ApiProperty()
    customLaundryName: string;

    @ApiProperty()
    customLaundryDescription: string;

    @ApiProperty()
    customLaundryLat: number;

    @ApiProperty()
    customLaundryLong: number;

    @ApiProperty({ required: false })
    customLaundryAddress?: string;

    @ApiProperty()
    totalAmount: number;

    @ApiProperty({ required: false })
    adminServiceCharge?: number;

    @ApiProperty({ required: false })
    customVendorPaid?: number;

    @ApiProperty({ required: false })
    customVendorReceipt?: string;

    @ApiProperty({ required: false })
    payTabsInvoiceUrl?: string;

    @ApiProperty({ required: false })
    customerPaid?: boolean;

    @ApiProperty({ type: CustomOrderUser })
    user: CustomOrderUser;

    @ApiProperty({ type: CustomOrderPickup })
    pickup: CustomOrderPickup;

    @ApiProperty({ type: CustomOrderDelivery })
    delivery: CustomOrderDelivery;

    @ApiProperty({ type: [CustomOrderRiderAssignment] })
    RiderOrder: CustomOrderRiderAssignment[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class GetCustomOrdersResponseDTO {
    @ApiProperty({ type: [CustomOrder] })
    data: CustomOrder[];
}

export class GetCustomOrderByIdResponseDTO {
    @ApiProperty({ type: CustomOrder })
    data: CustomOrder;
}
