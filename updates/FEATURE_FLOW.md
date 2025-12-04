# Payment Link Regeneration - Feature Flow Diagram

## User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL UI                              │
└─────────────────────────────────────────────────────────────────────┘

1. Admin navigates to Custom Order Details page
   └─→ Order has payment link but customer hasn't paid

2. Admin sees "Customer Payment Invoice" section showing:
   ┌───────────────────────────────────────────────────┐
   │ Invoice Link: [payment-link-url]                 │
   │ [Copy] [Open]                                     │
   │                                                   │
   │ [Regenerate Payment Link] or [Regenerate in 15min]│
   │ Link created: Nov 22, 2024, 10:30 AM             │
   └───────────────────────────────────────────────────┘

3. Button states based on conditions:

   ┌─────────────────┬──────────────────┬────────────────────┐
   │   Condition     │   Button State   │    Button Text     │
   ├─────────────────┼──────────────────┼────────────────────┤
   │ < 20 minutes    │ Disabled (gray)  │ Regenerate in X min│
   │ ≥ 20 minutes    │ Enabled (orange) │ Regenerate Payment │
   │ During API call │ Disabled         │ [Loading spinner]  │
   │ Payment received│ Hidden           │ N/A                │
   └─────────────────┴──────────────────┴────────────────────┘

4. Admin clicks "Regenerate Payment Link"
   └─→ Frontend validates time requirement
       └─→ If < 20 min: Show error toast
       └─→ If ≥ 20 min: Call API
```

## System Flow

```
┌──────────────┐
│ Admin Panel  │
│  (Frontend)  │
└──────┬───────┘
       │
       │ POST /admin/custom-order/:orderId/regenerate-payment-link
       ↓
┌──────────────────────────────────────────────────────────────┐
│                    Backend API                               │
│                                                              │
│  1. Controller receives request                             │
│     └─→ admin.controller.ts: regeneratePaymentLink()        │
│                                                              │
│  2. Service validates and processes                         │
│     └─→ adminCustomOrder.service.ts                         │
│                                                              │
│     ┌────────────────────────────────────────┐              │
│     │ VALIDATION CHECKS                      │              │
│     ├────────────────────────────────────────┤              │
│     │ ✓ Order exists?                        │              │
│     │ ✓ Is custom order type?                │              │
│     │ ✓ Payment NOT received?                │              │
│     │ ✓ Payment link exists?                 │              │
│     │ ✓ Link ≥ 20 minutes old?               │              │
│     └────────────────────────────────────────┘              │
│            │                                                 │
│            │ All checks pass ✓                              │
│            ↓                                                 │
│     ┌────────────────────────────────────────┐              │
│     │ REGENERATION PROCESS                   │              │
│     ├────────────────────────────────────────┤              │
│     │ 1. Call PayTabs API                    │              │
│     │    └─→ Generate new invoice            │              │
│     │                                         │              │
│     │ 2. Update Order in database            │              │
│     │    - New invoiceId                     │              │
│     │    - New invoiceUrl                    │              │
│     │    - New transactionRef                │              │
│     │    - NEW timestamp (NOW)               │              │
│     │                                         │              │
│     │ 3. Send notification to customer       │              │
│     │    └─→ Push notification with link     │              │
│     │                                         │              │
│     │ 4. Log admin activity                  │              │
│     │    └─→ Create notification record      │              │
│     │                                         │              │
│     │ 5. Return success response             │              │
│     └────────────────────────────────────────┘              │
│                                                              │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ Success response with new link
       ↓
┌──────────────┐
│ Admin Panel  │
│  (Frontend)  │
│              │
│ • Show success toast                                         │
│ • Invalidate cache                                           │
│ • Refetch order details                                      │
│ • Update UI with new link                                    │
│ • Reset countdown timer                                      │
└──────────────┘
```

## Time Restriction Logic

```
Current Time: 2024-11-22 11:00:00
Link Created: 2024-11-22 10:30:00
Difference: 30 minutes

┌──────────────────────────────────────────────────────┐
│ Time Calculation                                     │
├──────────────────────────────────────────────────────┤
│ now = new Date()                                     │
│ linkCreatedAt = new Date(payTabsInvoiceDateCreated)  │
│ timeDiff = (now - linkCreatedAt) / (1000 * 60)      │
│ // Result in minutes: 30                            │
│                                                      │
│ if (timeDiff < 20) {                                │
│   remainingMin = Math.ceil(20 - timeDiff)           │
│   // Show: "Regenerate in X min"                   │
│ } else {                                            │
│   // Allow regeneration                            │
│ }                                                   │
└──────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     ERROR SCENARIOS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Payment Already Received                                │
│     ┌─────────────────────────────────────────┐             │
│     │ Backend: 400 Bad Request               │             │
│     │ "Payment has already been received"    │             │
│     │                                        │             │
│     │ Frontend: Error toast                  │             │
│     │ Button: Hidden from UI                 │             │
│     └─────────────────────────────────────────┘             │
│                                                             │
│  2. Too Soon (< 20 minutes)                                 │
│     ┌─────────────────────────────────────────┐             │
│     │ Backend: 400 Bad Request               │             │
│     │ "Please wait X more minute(s)"         │             │
│     │                                        │             │
│     │ Frontend: Error toast with countdown   │             │
│     │ Button: Disabled showing "Regenerate in X min" │      │
│     └─────────────────────────────────────────┘             │
│                                                             │
│  3. No Payment Link Exists                                  │
│     ┌─────────────────────────────────────────┐             │
│     │ Backend: 400 Bad Request               │             │
│     │ "No payment link exists"               │             │
│     │                                        │             │
│     │ Frontend: Error toast                  │             │
│     │ Section: Not displayed                 │             │
│     └─────────────────────────────────────────┘             │
│                                                             │
│  4. Order Not Found                                         │
│     ┌─────────────────────────────────────────┐             │
│     │ Backend: 404 Not Found                 │             │
│     │ "Custom order not found"               │             │
│     │                                        │             │
│     │ Frontend: Error toast                  │             │
│     │ Redirect: Back to orders list          │             │
│     └─────────────────────────────────────────┘             │
│                                                             │
│  5. Network/Server Error                                    │
│     ┌─────────────────────────────────────────┐             │
│     │ Backend: 500 Internal Server Error     │             │
│     │                                        │             │
│     │ Frontend: Generic error toast          │             │
│     │ "Failed to regenerate payment link"    │             │
│     │ Button: Re-enabled for retry           │             │
│     └─────────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Change

```sql
-- Before
CREATE TABLE "Order" (
  ...
  "payTabsInvoiceId" TEXT,
  "payTabsInvoiceUrl" TEXT,
  -- No timestamp field
  "customerPaid" BOOLEAN DEFAULT false,
  "payTabsTransactionRef" TEXT,
  ...
);

-- After Migration
CREATE TABLE "Order" (
  ...
  "payTabsInvoiceId" TEXT,
  "payTabsInvoiceUrl" TEXT,
  "payTabsInvoiceDateCreated" TIMESTAMPTZ,  ← NEW FIELD
  "customerPaid" BOOLEAN DEFAULT false,
  "payTabsTransactionRef" TEXT,
  ...
);
```

## API Request/Response Examples

### Request

```http
POST /api/v1/admin/custom-order/abc123-def456/regenerate-payment-link
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Success Response

```json
{
  "data": {
    "orderId": "abc123-def456",
    "payTabsInvoice": {
      "invoiceId": "INV-789012",
      "invoiceUrl": "https://secure.paytabs.sa/payment/page/..."
    }
  },
  "message": "Payment link regenerated successfully and sent to customer"
}
```

### Error Response (Too Soon)

```json
{
  "statusCode": 400,
  "message": "Payment link can only be regenerated after 20 minutes. Please wait 15 more minute(s)",
  "error": "Bad Request"
}
```

### Error Response (Already Paid)

```json
{
  "statusCode": 400,
  "message": "Payment has already been received for this order",
  "error": "Bad Request"
}
```

## Component Interaction Map

```
CustomOrderDetails.tsx
│
├─→ useRegeneratePaymentLink() hook
│   │
│   ├─→ API: POST /admin/custom-order/:id/regenerate-payment-link
│   │
│   └─→ On Success:
│       ├─→ Invalidate query cache
│       ├─→ Show success toast
│       └─→ Refetch order details
│
├─→ canRegeneratePaymentLink() function
│   │
│   └─→ Checks:
│       ├─→ payTabsInvoiceDateCreated exists?
│       ├─→ customerPaid is false?
│       └─→ Time difference ≥ 20 minutes?
│
├─→ getRemainingTime() function
│   │
│   └─→ Calculates: 20 - timeDifference
│
└─→ handleRegeneratePaymentLink() function
    │
    ├─→ Validate can regenerate
    ├─→ Call mutation
    └─→ Handle success/error
```

## Notification Flow

```
┌──────────────────────────────────────────────────────────┐
│              Customer Notification Flow                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Payment link regenerated                            │
│     ↓                                                    │
│  2. notifyCustomerPaymentRequired() called              │
│     ↓                                                    │
│  3. Fetch customer device tokens from database          │
│     ↓                                                    │
│  4. Build notification payload:                         │
│     {                                                    │
│       tokens: [customer_device_tokens],                 │
│       title: "Payment Required",                        │
│       body: "Please pay invoice for order #X",          │
│       notificationData: {                               │
│         orderId: "...",                                 │
│         invoiceUrl: "https://...",                      │
│         key: "PAY_CUSTOM_ORDER",                        │
│         route: "Payment"                                │
│       }                                                 │
│     }                                                   │
│     ↓                                                    │
│  5. Send push notification via Firebase/FCM            │
│     ↓                                                    │
│  6. Customer receives notification on mobile device     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Timeline Example

```
10:00 AM - Initial payment link created
          payTabsInvoiceDateCreated = 2024-11-22T10:00:00Z

10:05 AM - Admin tries to regenerate
          ❌ ERROR: "Please wait 15 more minute(s)"

10:15 AM - Admin tries to regenerate
          ❌ ERROR: "Please wait 5 more minute(s)"

10:20 AM - Admin can now regenerate
          ✅ SUCCESS: New link generated
          payTabsInvoiceDateCreated = 2024-11-22T10:20:00Z

10:25 AM - Admin tries to regenerate again
          ❌ ERROR: "Please wait 15 more minute(s)"

10:40 AM - Admin can regenerate again
          ✅ SUCCESS: New link generated
          payTabsInvoiceDateCreated = 2024-11-22T10:40:00Z
```

---

This flow ensures payment links can be regenerated when needed while preventing abuse through time-based restrictions.
