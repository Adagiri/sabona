import { ApiProperty } from '@nestjs/swagger';

class PayTabsInvoiceData {
    @ApiProperty()
    invoiceId: string;

    @ApiProperty()
    invoiceUrl: string;
}

class VendorDetailsData {
    @ApiProperty()
    name: string;

    @ApiProperty()
    amountPaid: number;

    @ApiProperty()
    paymentMethod: string;
}

class ReceiptUploadData {
    @ApiProperty()
    orderId: string;

    @ApiProperty()
    receiptUploaded: boolean;

    @ApiProperty({ type: PayTabsInvoiceData })
    payTabsInvoice: PayTabsInvoiceData;

    @ApiProperty({ type: VendorDetailsData })
    vendorDetails: VendorDetailsData;
}

export class UploadReceiptResponseDTO {
    @ApiProperty({ type: ReceiptUploadData })
    data: ReceiptUploadData;

    @ApiProperty()
    message: string;
}
