# Payment Link Regeneration Feature - Implementation Guide

## Overview

This feature allows administrators to regenerate payment links for custom orders when:
- The previous payment link is older than 20 minutes
- Payment has not been received yet

This is useful when customers don't receive or lose payment links, or when links expire.

## Feature Requirements

✅ **20-Minute Time Restriction:** Payment links can only be regenerated after 20 minutes have passed since the last generation
✅ **Payment Status Check:** Regeneration is blocked if payment has already been received
✅ **Automatic Notification:** Customers receive push notifications with the new payment link
✅ **Admin Activity Logging:** All regeneration actions are logged for audit purposes
✅ **User-Friendly UI:** Admin panel shows countdown timer and clear status indicators

## Repository Structure

```
updates/
├── README.md                          # This file
├── backend/                           # Backend implementation files
│   ├── IMPLEMENTATION_INSTRUCTIONS.md # Detailed backend setup guide
│   ├── schema.prisma                  # Updated Prisma schema
│   ├── admin.controller.ts            # Updated admin controller
│   ├── adminCustomOrder.service.ts    # Updated admin service
│   └── 20251122000000_add_payment_link_date_created/
│       └── migration.sql              # Database migration
└── admin-panel/                       # Frontend implementation files
    ├── IMPLEMENTATION_INSTRUCTIONS.md # Detailed frontend setup guide
    ├── customOrders.ts                # Updated mutations hook
    └── CustomOrderDetails.tsx         # Updated details page
```

## Quick Start

### Backend Implementation

1. Navigate to backend repository
2. Read `backend/IMPLEMENTATION_INSTRUCTIONS.md` for detailed steps
3. Copy updated files to your backend directory
4. Run database migration: `npm run db:migrate`
5. Restart server

**Key Files:**
- `prisma/schema.prisma` - Adds `payTabsInvoiceDateCreated` field
- `src/modules/app/admin/adminCustomOrder.service.ts` - Adds regeneration logic
- `src/modules/app/admin/admin.controller.ts` - Adds API endpoint
- `prisma/migrations/...` - Database migration

### Admin Panel Implementation

1. Navigate to admin-panel repository
2. Read `admin-panel/IMPLEMENTATION_INSTRUCTIONS.md` for detailed steps
3. Copy updated files to your admin panel directory
4. Restart development server

**Key Files:**
- `src/hooks/Admin/mutations/customOrders.ts` - Adds regeneration mutation hook
- `src/pages/CustomOrderDetails.tsx` - Adds UI button and logic

## API Endpoint

### Regenerate Payment Link

**Endpoint:** `POST /api/v1/admin/custom-order/:orderId/regenerate-payment-link`

**Authorization:** Admin only (Bearer token required)

**Request:**
```bash
POST /api/v1/admin/custom-order/abc123/regenerate-payment-link
Authorization: Bearer {admin_token}
```

**Success Response (200):**
```json
{
  "data": {
    "orderId": "abc123",
    "payTabsInvoice": {
      "invoiceId": "INV-123456",
      "invoiceUrl": "https://secure.paytabs.sa/payment/page/..."
    }
  },
  "message": "Payment link regenerated successfully and sent to customer"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Payment already received | Customer has already paid this invoice |
| 400 | No payment link exists | No initial payment link was generated |
| 400 | Too soon to regenerate | Less than 20 minutes have passed (includes remaining time) |
| 404 | Order not found | Invalid order ID or not a custom order |

## Database Changes

### New Field: `payTabsInvoiceDateCreated`

**Table:** `Order`
**Type:** `TIMESTAMPTZ` (nullable)
**Purpose:** Tracks when the payment link was created/regenerated

**Migration:**
```sql
ALTER TABLE "Order" ADD COLUMN "payTabsInvoiceDateCreated" TIMESTAMPTZ;
```

## UI Features

### Regenerate Button States

1. **Countdown Mode** (< 20 minutes)
   - Disabled button showing "Regenerate in X min"
   - Updates dynamically as time passes

2. **Ready Mode** (≥ 20 minutes)
   - Enabled button showing "Regenerate Payment Link"
   - Orange/warning color to indicate caution

3. **Loading Mode** (during API call)
   - Disabled button with spinner
   - Prevents double-submission

4. **Hidden Mode** (payment received)
   - Button not displayed if customer has paid

### Additional UI Elements

- **Link Created Timestamp:** Shows when the current payment link was generated
- **Success/Error Toasts:** Clear feedback for all actions
- **Auto-refresh:** Order details automatically update after regeneration

## Business Logic

### Validation Flow

```
1. Check if order exists and is custom order type
2. Check if payment has NOT been received
3. Check if payment link exists
4. Calculate time since link creation
5. Verify ≥ 20 minutes have passed
6. Generate new PayTabs invoice
7. Update order with new link and timestamp
8. Notify customer via push notification
9. Log admin activity
10. Return success response
```

### Time Calculation

```typescript
const now = new Date();
const linkCreatedAt = new Date(order.payTabsInvoiceDateCreated);
const timeDifferenceInMinutes = (now.getTime() - linkCreatedAt.getTime()) / (1000 * 60);

if (timeDifferenceInMinutes < 20) {
  // Too soon - show remaining time
  const remainingMinutes = Math.ceil(20 - timeDifferenceInMinutes);
  // Error: Wait X more minutes
}
```

## Testing Guide

### Backend Testing

```bash
# Test regeneration too soon (should fail)
POST /api/v1/admin/custom-order/{orderId}/regenerate-payment-link
# Expected: 400 "Please wait X more minute(s)"

# Test regeneration after 20+ minutes (should succeed)
POST /api/v1/admin/custom-order/{orderId}/regenerate-payment-link
# Expected: 200 with new invoice URL

# Test regeneration on paid order (should fail)
POST /api/v1/admin/custom-order/{paid_orderId}/regenerate-payment-link
# Expected: 400 "Payment has already been received"
```

### Frontend Testing

1. Navigate to custom order details page
2. Verify payment invoice section shows:
   - Current payment link with Copy/Open buttons
   - "Regenerate Payment Link" button
   - Link creation timestamp
3. Test button states:
   - If < 20 min: Button disabled, shows countdown
   - If ≥ 20 min: Button enabled, shows "Regenerate"
   - If paid: Button hidden
4. Click regenerate button:
   - Loading state appears
   - Success toast shows
   - Payment link updates
   - Timestamp updates
   - Countdown resets to 20 minutes

## Production Deployment Checklist

### Backend

- [ ] Database migration applied to production database
- [ ] Backend code deployed with updated files
- [ ] Prisma client regenerated
- [ ] Server restarted
- [ ] API endpoint accessible and responds correctly
- [ ] Push notifications configured and working

### Frontend

- [ ] Admin panel code deployed with updated files
- [ ] Production build created successfully
- [ ] UI displays correctly in production
- [ ] API calls reach backend successfully
- [ ] Error handling works as expected

### Verification

- [ ] Test with real custom order data
- [ ] Verify 20-minute restriction works
- [ ] Verify payment status check works
- [ ] Verify customer receives notification
- [ ] Verify admin activity logged
- [ ] Verify UI countdown timer accurate
- [ ] Monitor logs for any errors

## Rollback Plan

If you need to rollback this feature:

### Backend Rollback

```bash
# Revert database migration
npx prisma migrate rollback

# Restore previous code files
git checkout HEAD~1 -- src/modules/app/admin/admin.controller.ts
git checkout HEAD~1 -- src/modules/app/admin/adminCustomOrder.service.ts
git checkout HEAD~1 -- prisma/schema.prisma

# Regenerate Prisma client
npm run db:generate

# Restart server
```

### Frontend Rollback

```bash
# Restore previous code files
git checkout HEAD~1 -- src/hooks/Admin/mutations/customOrders.ts
git checkout HEAD~1 -- src/pages/CustomOrderDetails.tsx

# Restart development server or rebuild
```

## Support & Troubleshooting

### Common Issues

**Issue:** Migration fails with "column already exists"
- **Solution:** Check if migration was already applied. If yes, skip migration step.

**Issue:** TypeScript errors in admin panel
- **Solution:** Ensure order type includes `payTabsInvoiceDateCreated?: string`

**Issue:** Button always shows countdown
- **Solution:** Verify backend is returning `payTabsInvoiceDateCreated` in API response

**Issue:** Customer not receiving notification
- **Solution:** Check push notification service configuration and device tokens

**Issue:** "Failed to regenerate payment link" error
- **Solution:** Check backend logs for detailed error message

## Documentation References

- PayTabs API Documentation: https://site.paytabs.com/en/
- Prisma Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- React Query Mutations: https://tanstack.com/query/latest/docs/react/guides/mutations

## Change Log

### Version 1.0.0 (November 2024)
- Initial implementation of payment link regeneration feature
- Added 20-minute time restriction
- Added payment status validation
- Created admin UI with countdown timer
- Implemented customer notifications
- Added admin activity logging

## Contributors

This feature was implemented to improve the custom order workflow and reduce customer service burden when payment links are not received or expire.

---

For detailed implementation instructions, see:
- **Backend:** `backend/IMPLEMENTATION_INSTRUCTIONS.md`
- **Frontend:** `admin-panel/IMPLEMENTATION_INSTRUCTIONS.md`
