import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsDateString, Min, Max, IsUUID } from 'class-validator';

export class UpdateCustomOrderPricingRequestDTO {
    @ApiProperty({ description: 'Admin service charge in SAR' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    adminServiceCharge: number;

    @ApiProperty({ description: 'Total amount customer will pay in SAR' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    totalAmount: number;

    @ApiProperty({ description: 'Estimated vendor cost in SAR', required: false })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    estimatedVendorCost?: number;

    @ApiProperty({ description: 'Admin notes about pricing decision', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class AssignDriverToCustomOrderRequestDTO {
    @ApiProperty({ description: 'Driver/Rider ID to assign' })
    @IsUUID()
    riderId: string;

    @ApiProperty({ description: 'Optional notes about the assignment', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UploadCustomOrderReceiptRequestDTO {
    @ApiProperty({ description: 'Vendor name as shown on receipt' })
    @IsString()
    vendorName: string;

    @ApiProperty({ description: 'Amount paid to vendor in SAR' })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    amountPaid: number;

    @ApiProperty({
        description: 'Payment method used',
        enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'],
    })
    @IsEnum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'])
    paymentMethod: string;

    @ApiProperty({ description: 'Additional notes about the payment', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class MarkCustomOrderReadyRequestDTO {
    @ApiProperty({ description: 'Optional delivery driver ID to assign', required: false })
    @IsOptional()
    @IsUUID()
    deliveryRiderId?: string;
}

export class SearchCustomOrdersRequestDTO {
    @ApiProperty({ description: 'Search query', required: false })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiProperty({ description: 'Filter by status', required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ description: 'Filter by customer name', required: false })
    @IsOptional()
    @IsString()
    customerName?: string;

    @ApiProperty({ description: 'Filter by laundry name', required: false })
    @IsOptional()
    @IsString()
    laundryName?: string;

    @ApiProperty({ description: 'Date from (ISO string)', required: false })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiProperty({ description: 'Date to (ISO string)', required: false })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiProperty({ description: 'Minimum amount', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minAmount?: number;

    @ApiProperty({ description: 'Maximum amount', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxAmount?: number;

    @ApiProperty({ description: 'Page number for pagination', required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiProperty({ description: 'Items per page', required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number;
}

export class UpdateCustomOrderNotesRequestDTO {
    @ApiProperty({ description: 'Admin notes for the order' })
    @IsString()
    notes: string;
}

export class CancelCustomOrderRequestDTO {
    @ApiProperty({ description: 'Reason for cancellation' })
    @IsString()
    reason: string;

    @ApiProperty({ description: 'Should refund customer if paid', required: false })
    @IsOptional()
    @IsBoolean()
    refundCustomer?: boolean;
}

export class ExportCustomOrdersRequestDTO {
    @ApiProperty({
        description: 'Export format',
        enum: ['csv', 'excel', 'pdf'],
        required: false,
        default: 'csv',
    })
    @IsOptional()
    @IsEnum(['csv', 'excel', 'pdf'])
    format?: string;

    @ApiProperty({ description: 'Start date for export', required: false })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiProperty({ description: 'End date for export', required: false })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiProperty({ description: 'Filter by status', required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ description: 'Include customer personal data', required: false })
    @IsOptional()
    @IsBoolean()
    includeCustomerData?: boolean;

    @ApiProperty({ description: 'Include financial data', required: false })
    @IsOptional()
    @IsBoolean()
    includeFinancialData?: boolean;
}

// ==================== RESPONSE DTOS ====================

export class CustomOrderCustomerResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ required: false })
    phone?: string;
}

export class CustomOrderPickupResponseDTO {
    @ApiProperty()
    pickupDate: string;

    @ApiProperty()
    pickupTime: string;

    @ApiProperty()
    pickupAddress: string;

    @ApiProperty({ required: false })
    pickupLat?: number;

    @ApiProperty({ required: false })
    pickupLong?: number;
}

export class CustomOrderDeliveryResponseDTO {
    @ApiProperty()
    deliveryAddress: string;

    @ApiProperty()
    deliveryType: string;

    @ApiProperty({ required: false })
    deliveryLat?: number;

    @ApiProperty({ required: false })
    deliveryLong?: number;
}

export class CustomOrderRiderResponseDTO {
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

    @ApiProperty({ required: false })
    rating?: number;

    @ApiProperty({ required: false })
    totalOrders?: number;

    @ApiProperty()
    isAvailable: boolean;

    @ApiProperty({ required: false })
    distanceFromPickup?: number;

    @ApiProperty({ required: false })
    estimatedArrival?: string;
}

export class CustomOrderRiderOrderResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    createdAt: string;

    @ApiProperty({ required: false })
    completedAt?: string;

    @ApiProperty()
    rider: CustomOrderRiderResponseDTO;
}

export class CustomOrderResponseDTO {
    @ApiProperty()
    id: string;

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
    status: string;

    @ApiProperty()
    createdAt: string;

    @ApiProperty()
    updatedAt: string;

    @ApiProperty({ required: false })
    adminServiceCharge?: number;

    @ApiProperty({ required: false })
    totalAmount?: number;

    @ApiProperty({ required: false })
    vatAmount?: number;

    @ApiProperty({ required: false })
    baseAmount?: number;

    @ApiProperty({ required: false })
    vatIncluded?: boolean;

    @ApiProperty()
    customerPaid: boolean;

    @ApiProperty({ required: false })
    payTabsInvoiceUrl?: string;

    @ApiProperty({ required: false })
    customVendorPaid?: number;

    @ApiProperty({ required: false })
    customVendorName?: string;

    @ApiProperty({ required: false })
    customPaymentMethod?: string;

    @ApiProperty()
    customer: CustomOrderCustomerResponseDTO;

    @ApiProperty()
    pickup: CustomOrderPickupResponseDTO;

    @ApiProperty()
    delivery: CustomOrderDeliveryResponseDTO;

    @ApiProperty({ type: [CustomOrderRiderOrderResponseDTO] })
    riderOrders: CustomOrderRiderOrderResponseDTO[];

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty({ required: false })
    adminNotes?: string;
}

export class CustomOrderStatsResponseDTO {
    @ApiProperty()
    totalOrders: number;

    @ApiProperty()
    pendingPricing: number;

    @ApiProperty()
    awaitingDriver: number;

    @ApiProperty()
    inProgress: number;

    @ApiProperty()
    completed: number;

    @ApiProperty()
    cancelled: number;

    @ApiProperty()
    totalRevenue: number;

    @ApiProperty()
    averageOrderValue: number;

    @ApiProperty()
    completionRate: number;

    @ApiProperty()
    averageProcessingTime: number;

    @ApiProperty()
    needsDriverAssignment: number;

    @ApiProperty()
    awaitingPayment: number;

    @ApiProperty()
    needsDeliveryAssignment: number;
}

export class CustomOrderActionResponseDTO {
    @ApiProperty()
    type: string;

    @ApiProperty()
    label: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    required: boolean;

    @ApiProperty()
    completable: boolean;

    @ApiProperty()
    priority: string;
}

export class CustomOrderBlockerResponseDTO {
    @ApiProperty()
    type: string;

    @ApiProperty()
    message: string;

    @ApiProperty()
    severity: string;
}

export class CustomOrderTimelineEventResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    message: string;

    @ApiProperty()
    timestamp: string;

    @ApiProperty({ required: false })
    actor?: {
        type: string;
        name: string;
    };

    @ApiProperty({ required: false })
    metadata?: Record<string, any>;
}

export class CustomOrderWorkflowStatusResponseDTO {
    @ApiProperty()
    orderId: string;

    @ApiProperty()
    currentStatus: string;

    @ApiProperty({ type: [CustomOrderActionResponseDTO] })
    nextActions: CustomOrderActionResponseDTO[];

    @ApiProperty({ type: [CustomOrderBlockerResponseDTO] })
    blockers: CustomOrderBlockerResponseDTO[];

    @ApiProperty({ type: [CustomOrderTimelineEventResponseDTO] })
    timeline: CustomOrderTimelineEventResponseDTO[];
}

export class GetCustomOrderDetailsResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    data: CustomOrderResponseDTO;

    @ApiProperty({ required: false })
    message?: string;
}

export class GetAllCustomOrdersResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty({ type: [CustomOrderResponseDTO] })
    data: CustomOrderResponseDTO[];

    @ApiProperty()
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };

    @ApiProperty({ required: false })
    message?: string;
}

export class GetCustomOrderStatsResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    data: CustomOrderStatsResponseDTO;

    @ApiProperty({ required: false })
    message?: string;
}

export class GetAvailableDriversResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty({ type: [CustomOrderRiderResponseDTO] })
    data: CustomOrderRiderResponseDTO[];

    @ApiProperty({ required: false })
    message?: string;
}

export class AssignDriverResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    data: {
        orderId: string;
        riderId: string;
        assignedAt: string;
    };

    @ApiProperty({ required: false })
    message?: string;
}

export class UploadReceiptResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    data: {
        orderId: string;
        receiptImagePath: string;
        payTabsInvoiceId: string;
        payTabsInvoiceUrl: string;
    };

    @ApiProperty({ required: false })
    message?: string;
}

export class CustomOrderMessageResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;

    @ApiProperty({ required: false })
    data?: any;
}
