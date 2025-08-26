import { ApiProperty } from '@nestjs/swagger';

class CustomOrderCustomer {
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

class CustomOrderPickupDetails {
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

    @ApiProperty()
    status: string;

    @ApiProperty({ required: false })
    riderId?: string;
}

class CustomOrderDeliveryDetails {
    @ApiProperty()
    deliveryAddress: string;

    @ApiProperty()
    deliveryLat: number;

    @ApiProperty()
    deliveryLong: number;

    @ApiProperty({ required: false })
    deliveryDate?: string;

    @ApiProperty()
    status: string;

    @ApiProperty({ required: false })
    riderId?: string;
}

class AssignedRiderInfo {
    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    phone: string;
}

class CustomOrderRiderAssignmentDetails {
    @ApiProperty()
    id: string;

    @ApiProperty()
    type: string; // 'RIDER_PICKUP' or 'RIDER_DELIVERY'

    @ApiProperty()
    assignedAt: Date;

    @ApiProperty({ type: AssignedRiderInfo })
    rider: AssignedRiderInfo;
}

class OrderStatusHistoryItem {
    @ApiProperty()
    status: string;

    @ApiProperty()
    timestamp: Date;
}

export class CustomOrderDetailsData {
    @ApiProperty()
    id: string;

    @ApiProperty()
    orderNumber: number;

    @ApiProperty()
    orderType: string;

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
    customVendorReceipt?: string;

    @ApiProperty({ required: false })
    customVendorName?: string;

    @ApiProperty({ required: false })
    customVendorPaid?: number;

    @ApiProperty({ required: false })
    customPaymentMethod?: string;

    @ApiProperty({ required: false })
    payTabsInvoiceId?: string;

    @ApiProperty({ required: false })
    payTabsInvoiceUrl?: string;

    @ApiProperty({ required: false })
    customerPaid?: boolean;

    @ApiProperty({ required: false })
    customerPaymentDate?: Date;

    @ApiProperty({ type: CustomOrderCustomer })
    user: CustomOrderCustomer;

    @ApiProperty({ type: CustomOrderPickupDetails })
    pickup: CustomOrderPickupDetails;

    @ApiProperty({ type: CustomOrderDeliveryDetails })
    delivery: CustomOrderDeliveryDetails;

    @ApiProperty({ type: [CustomOrderRiderAssignmentDetails] })
    RiderOrder: CustomOrderRiderAssignmentDetails[];

    @ApiProperty({ type: [OrderStatusHistoryItem] })
    statusHistory: OrderStatusHistoryItem[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class GetCustomOrderDetailsResponseDTO {
    @ApiProperty({ type: CustomOrderDetailsData })
    data: CustomOrderDetailsData;
}
