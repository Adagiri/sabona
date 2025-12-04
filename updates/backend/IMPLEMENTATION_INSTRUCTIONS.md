# Backend Implementation Instructions
## Payment Link Regeneration Feature for Custom Orders

### Overview
This feature allows admins to regenerate payment links for custom orders with the following requirements:
- Payment link must be more than 20 minutes old
- Payment must not have been received yet

### Files to Update

#### 1. Database Schema
**File:** `prisma/schema.prisma`
**Location in file:** Line 638 (in the Order model, under "Custom order - PayTabs customer payment" section)

**Change:** Add new field to track when payment link was created
```prisma
payTabsInvoiceDateCreated  DateTime? @db.Timestamptz() // When payment link was generated
```

**Full section should look like:**
```prisma
// Custom order - PayTabs customer payment
payTabsInvoiceId           String? // PayTabs invoice ID
payTabsInvoiceUrl          String? // Invoice link admin sends to customer
payTabsInvoiceDateCreated  DateTime? @db.Timestamptz() // When payment link was generated
customerPaid               Boolean?  @default(false) // Customer payment status via PayTabs
customerPaymentDate        DateTime? // When customer paid the invoice
payTabsTransactionRef      String? // PayTabs transaction reference
```

#### 2. Admin Custom Order Service
**File:** `src/modules/app/admin/adminCustomOrder.service.ts`

**Changes:**

a) **Line 203:** Update the existing `uploadCustomOrderReceipt` method to set the timestamp when creating payment link:
```typescript
data: {
    payTabsInvoiceId: payTabsInvoice.invoiceId,
    payTabsInvoiceUrl: payTabsInvoice.invoiceUrl,
    payTabsTransactionRef: payTabsInvoice.transactionRef,
    payTabsInvoiceDateCreated: new Date(),  // ADD THIS LINE
},
```

b) **After line 479 (after `handlePayTabsCallback` method):** Add new `regeneratePaymentLink` method:
```typescript
/**
 * Regenerate payment link for custom order
 * Can only regenerate if:
 * - Previous link is older than 20 minutes
 * - Payment has not been received yet
 */
async regeneratePaymentLink(orderId: string, adminUser: User): Promise<any> {
    const order = await this._dbService.order.findUnique({
        where: {
            id: orderId,
            orderType: OrderType.CUSTOM_LAUNDRY,
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                },
            },
        },
    });

    if (!order) {
        throw new BadRequestException('Custom order not found');
    }

    // Check if payment has already been received
    if (order.customerPaid) {
        throw new BadRequestException('Payment has already been received for this order');
    }

    // Check if payment link exists
    if (!order.payTabsInvoiceUrl || !order.payTabsInvoiceDateCreated) {
        throw new BadRequestException('No payment link exists for this order');
    }

    // Check if payment link is older than 20 minutes
    const now = new Date();
    const linkCreatedAt = new Date(order.payTabsInvoiceDateCreated);
    const timeDifferenceInMinutes = (now.getTime() - linkCreatedAt.getTime()) / (1000 * 60);

    if (timeDifferenceInMinutes < 20) {
        const remainingMinutes = Math.ceil(20 - timeDifferenceInMinutes);
        throw new BadRequestException(
            `Payment link can only be regenerated after 20 minutes. Please wait ${remainingMinutes} more minute(s)`,
        );
    }

    // Generate new PayTabs invoice
    const payTabsInvoice = await this.generatePayTabsInvoice(order, order.totalAmount);

    // Update order with new PayTabs info
    await this._dbService.order.update({
        where: { id: orderId },
        data: {
            payTabsInvoiceId: payTabsInvoice.invoiceId,
            payTabsInvoiceUrl: payTabsInvoice.invoiceUrl,
            payTabsTransactionRef: payTabsInvoice.transactionRef,
            payTabsInvoiceDateCreated: new Date(),
        },
    });

    // Notify customer with new payment link
    await this.notifyCustomerPaymentRequired(order.user, order, payTabsInvoice.invoiceUrl);

    // Create admin activity log
    await this._dbService.notification.create({
        data: {
            userId: adminUser.id,
            orderId: orderId,
            message: `Payment link regenerated for custom order #${order.orderNumber}`,
            status: 'UNREAD',
            data: {
                orderId: orderId,
                action: 'PAYMENT_LINK_REGENERATED',
                newInvoiceUrl: payTabsInvoice.invoiceUrl,
            },
            type: 'ORDER_PROCESSING',
        },
    });

    return {
        data: {
            orderId: orderId,
            payTabsInvoice: {
                invoiceId: payTabsInvoice.invoiceId,
                invoiceUrl: payTabsInvoice.invoiceUrl,
            },
        },
        message: 'Payment link regenerated successfully and sent to customer',
    };
}
```

#### 3. Admin Controller
**File:** `src/modules/app/admin/admin.controller.ts`

**Change:** After line 644 (after `uploadCustomOrderReceipt` endpoint), add new endpoint:
```typescript
@Authorized(UserType.ADMIN)
@Post({
    path: '/custom-order/:orderId/regenerate-payment-link',
    description: 'Regenerate payment link for custom order (only after 20 minutes and if not paid)',
    response: {},
})
async regeneratePaymentLink(@Param('orderId') orderId: string, @CurrentUser() adminUser: User): Promise<any> {
    return await this._adminCustomOrderService.regeneratePaymentLink(orderId, adminUser);
}
```

#### 4. Database Migration
**Folder:** `prisma/migrations/20251122000000_add_payment_link_date_created/`
**File:** `migration.sql`

Copy the migration folder to your `prisma/migrations/` directory, or create it manually with this content:
```sql
-- AlterTable
ALTER TABLE "Order" ADD COLUMN "payTabsInvoiceDateCreated" TIMESTAMPTZ;
```

### Implementation Steps

1. **Copy files from the updates folder:**
   ```bash
   # From your backend root directory
   cp /path/to/updates/backend/schema.prisma prisma/
   cp /path/to/updates/backend/admin.controller.ts src/modules/app/admin/
   cp /path/to/updates/backend/adminCustomOrder.service.ts src/modules/app/admin/
   cp -r /path/to/updates/backend/20251122000000_add_payment_link_date_created prisma/migrations/
   ```

2. **Apply database migration:**
   ```bash
   npm run db:migrate
   # Or if you're in production:
   npm run db:deploy
   ```

3. **Regenerate Prisma client:**
   ```bash
   npm run db:generate
   ```

4. **Restart your backend server:**
   ```bash
   npm run start:dev
   # Or for production:
   npm run start:prod
   ```

5. **Test the endpoint:**
   ```bash
   # Regenerate payment link (should fail if < 20 minutes)
   POST /api/v1/admin/custom-order/{orderId}/regenerate-payment-link
   Headers: Authorization: Bearer {admin_token}
   ```

### Testing Checklist

- [ ] Database migration applied successfully
- [ ] New field `payTabsInvoiceDateCreated` exists in Order table
- [ ] Payment link timestamp is set when initial payment link is created
- [ ] Regenerate endpoint returns error if payment already received
- [ ] Regenerate endpoint returns error if less than 20 minutes have passed
- [ ] Regenerate endpoint successfully generates new link after 20 minutes
- [ ] Customer receives notification with new payment link
- [ ] Admin activity is logged

### API Endpoint Details

**Endpoint:** `POST /api/v1/admin/custom-order/:orderId/regenerate-payment-link`

**Authorization:** Admin only

**Success Response (200):**
```json
{
  "data": {
    "orderId": "uuid",
    "payTabsInvoice": {
      "invoiceId": "string",
      "invoiceUrl": "https://..."
    }
  },
  "message": "Payment link regenerated successfully and sent to customer"
}
```

**Error Responses:**
- `400`: Payment already received
- `400`: No payment link exists
- `400`: Link can only be regenerated after 20 minutes (includes remaining time)
- `404`: Custom order not found

### Notes

- The 20-minute restriction is calculated from the `payTabsInvoiceDateCreated` field
- Each regeneration updates the timestamp, resetting the 20-minute timer
- Customers are automatically notified via push notification when link is regenerated
- Admin activity is logged for audit purposes
