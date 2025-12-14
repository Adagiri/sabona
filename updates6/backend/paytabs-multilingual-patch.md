# PayTabs Service - Multilingual Notifications Update

## File: backend/src/modules/app/paytabs/paytabs.service.ts

## Overview
Update all hardcoded English notifications in PayTabs service to use the multilingual notification system.

---

## Notification Points to Update

### 1. Customer Success Notification (Line ~527-566)

**Method**: `sendCustomerSuccessNotification`

**REMOVE:**
```typescript
await this._notificationService.SendNotificationToMultipleTokens({
    tokens: tokens,
    title: title,
    body: body,
    notificationData: {
        orderId: order.id,
        key: 'GET_ORDER_BY_ID',
        route: 'TrackOrder',
    },
});

// Create notification record
await this._dbService.notification.create({
    data: {
        userId: order.userId,
        orderId: order.id,
        message: title,
        status: 'UNREAD',
        type: 'ORDER_PAID',
        data: {
            orderId: order.id,
            transactionRef: order.payTabsTransactionRef,
        },
    },
});
```

**REPLACE WITH:**
```typescript
await this._notificationService.SendMultilingualNotificationToUser(
    order.userId,
    'ORDER_PAID',
    {
        orderId: order.id,
        key: 'GET_ORDER_BY_ID',
        route: 'TrackOrder',
    },
);
```

---

### 2. Vendor New Paid Order Notification (Line ~590-599)

**Method**: `sendVendorNotifications`

**REMOVE:**
```typescript
await this._notificationService.SendNotificationToMultipleTokens({
    tokens: vendorTokens,
    title: 'New Paid Order',
    body: `Order #${order.orderNumber} payment confirmed. Please accept or reject.`,
    notificationData: {
        orderId: order.id,
        key: 'FETCH_VENDOR_REQUESTS',
        route: 'Home',
    },
});
```

**REPLACE WITH:**
```typescript
await this._notificationService.SendMultilingualNotificationToUser(
    laundry.vendor.id,
    'NEW_PAID_ORDER',
    {
        orderId: order.id,
        key: 'FETCH_VENDOR_REQUESTS',
        route: 'Home',
    },
);
```

---

### 3. Admin Custom Order Complete (Line ~627-639)

**Method**: `sendAdminCustomOrderCompleteNotification`

**REMOVE:**
```typescript
await this._notificationService.SendNotificationToMultipleTokens({
    tokens: adminTokens,
    title: 'Custom Order Complete',
    body: `Customer payment received for custom order #${order.orderNumber}. Order is now complete.`,
    notificationData: {
        orderId: order.id,
        key: 'FETCH_CUSTOM_ORDERS',
        route: 'CustomOrders',
    },
});
```

**REPLACE WITH:**
```typescript
await this._notificationService.SendMultilingualNotificationToUser(
    admin.id,
    'CUSTOM_ORDER_COMPLETE',
    {
        orderId: order.id,
        key: 'FETCH_CUSTOM_ORDERS',
        route: 'CustomOrders',
    },
);
```

---

### 4. Payment Failed Notification (Line ~657-669)

**REMOVE:**
```typescript
await this._notificationService.SendNotificationToMultipleTokens({
    tokens: tokens,
    title: 'Payment Failed',
    body: `Payment for order #${order.orderNumber} was unsuccessful. ${additionalMessage}`,
    notificationData: {
        orderId: order.id,
        key: 'GET_ORDER_BY_ID',
        route: 'TrackOrder',
    },
});
```

**REPLACE WITH:**
```typescript
await this._notificationService.SendMultilingualNotificationToUser(
    order.userId,
    'PAYMENT_FAILED',
    {
        orderId: order.id,
        key: 'GET_ORDER_BY_ID',
        route: 'TrackOrder',
    },
);
```

---

### 5. Payment Refunded Notification (Line ~836-848)

**REMOVE:**
```typescript
await this._notificationService.SendNotificationToMultipleTokens({
    tokens: tokens,
    title: 'Payment Refunded',
    body: `Order #${order.orderNumber}: ${message}`,
    notificationData: {
        orderId: order.id,
        key: 'GET_ORDER_BY_ID',
        route: 'TrackOrder',
    },
});
```

**REPLACE WITH:**
```typescript
await this._notificationService.SendMultilingualNotificationToUser(
    order.userId,
    'PAYMENT_REFUNDED',
    {
        orderId: order.id,
        key: 'GET_ORDER_BY_ID',
        route: 'TrackOrder',
    },
);
```

---

### 6. Additional Payment Confirmed Notifications (Line ~862-875, ~903-915)

**Similar pattern - Replace hardcoded notifications with multilingual**

---

## Template Keys Required

Add these keys to `NOTIFICATION_TEMPLATES` if not already present:

- `ORDER_PAID` - Payment successful
- `NEW_PAID_ORDER` - New paid order (vendor)
- `CUSTOM_ORDER_COMPLETE` - Custom order payment complete (admin)
- `PAYMENT_FAILED` - Payment unsuccessful
- `PAYMENT_REFUNDED` - Payment refunded

---

## Impact
- ~6 notification points updated
- ~150 lines of hardcoded notification code removed
- All PayTabs notifications now multilingual
- Consistent with other services

---

**Status**: Ready for implementation  
**Priority**: Medium (improves consistency, important for multilingual support)
