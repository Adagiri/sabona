# Backend Updates: Multilingual Notification System

## Overview
Implemented a comprehensive multilingual notification system with support for English and Arabic, admin broadcast functionality, and improved error handling.

## Database Changes

### 1. User Model Update
**File:** `prisma/schema.prisma`

Added new field to User model:
```prisma
preferredLanguage String? @default("en") // User's preferred language for notifications (en, ar)
```

**Migration Created:** `prisma/migrations/20251209000000_add_user_preferred_language/migration.sql`

```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN "preferredLanguage" TEXT DEFAULT 'en';
```

**To Deploy:**
```bash
npm run db:deploy
```

## New Features Implemented

### 1. User Language Preference Management

#### New Endpoint
**PATCH** `/v1/user/preferred-language`

**Request:**
```json
{
  "preferredLanguage": "ar"  // "en" or "ar"
}
```

**Response:**
```json
{
  "id": "user-id",
  "preferredLanguage": "ar",
  "message": "Language preference updated successfully"
}
```

**Files Created:**
- `src/modules/app/user/dto/request/update_preferred_language.request.ts`
- `src/modules/app/user/dto/response/update_preferred_language.response.ts`

**Files Modified:**
- `src/modules/app/user/user.controller.ts` - Added endpoint handler
- `src/modules/app/user/user.service.ts` - Added UpdatePreferredLanguage method

---

### 2. Multilingual Notification System

#### Notification Templates
**File Created:** `src/modules/app/notification/notification.templates.ts`

Contains bilingual templates for all notification types:
- Order notifications (placed, accepted, rejected, in progress, ready, delivered)
- Payment confirmations
- Vendor notifications
- Admin notifications
- Rider notifications

**Template Structure:**
```typescript
export const NOTIFICATION_TEMPLATES = {
    ORDER_PLACED: {
        en: {
            title: 'Order Placed',
            body: 'Your order has been placed successfully',
        },
        ar: {
            title: 'تم تقديم الطلب',
            body: 'تم تقديم طلبك بنجاح',
        },
    },
    // ... more templates
};
```

#### New Service Methods
**File Modified:** `src/modules/app/notification/notification.service.ts`

**1. SendMultilingualNotificationToUser()**
- Sends notification to single user in their preferred language
- Automatically fetches user's language preference and device tokens
- Falls back to English if no preference set

**Usage:**
```typescript
await this._notificationService.SendMultilingualNotificationToUser(
    userId,
    'ORDER_PLACED',
    {
        orderId: order.id,
        key: 'FETCH_ORDERS',
        route: 'Orders',
    }
);
```

**2. SendMultilingualNotificationToMultipleUsers()**
- Sends notifications to multiple users
- Groups users by language preference for efficient batch sending
- Each language group receives notifications in their language

**Usage:**
```typescript
await this._notificationService.SendMultilingualNotificationToMultipleUsers(
    userIds,
    'NEW_REGULAR_ORDER',
    {
        orderId: orderId,
        key: 'FETCH_ORDERS',
        route: 'Orders',
    }
);
```

**3. CreateInAppNotification()**
- Creates in-app notification record for single user

**4. CreateInAppNotificationsForMultipleUsers()**
- Creates in-app notification records for multiple users

---

### 3. Admin Broadcast Notifications

#### New Endpoint
**POST** `/v1/notification/admin/broadcast` (Admin only)

**Request:**
```json
{
  "titleEn": "Special Offer",
  "bodyEn": "Get 20% off on your next order!",
  "titleAr": "عرض خاص",
  "bodyAr": "احصل على خصم 20% على طلبك التالي!",
  "actionType": "ORDERS",  // Optional: "ORDERS" | "PROFILE" | "HOME" | "PROMOTIONS"
  "route": "Orders",        // Optional: app route for deep linking

  // Filters (all optional)
  "userTypes": ["USER"],    // Filter by user type
  "registrationStartDate": "2024-01-01T00:00:00Z",
  "registrationEndDate": "2024-12-31T23:59:59Z",
  "minOrderCount": 1,
  "maxOrderCount": 100
}
```

**Response:**
```json
{
  "message": "Broadcast notification sent successfully",
  "totalRecipients": 150,
  "notificationsSent": 150
}
```

**Features:**
- Filters by user type, registration date, and order count
- Only sends to ACTIVE users with device tokens
- Automatically sends each user their preferred language version
- Groups by language for efficient batch sending

**Files Created:**
- `src/modules/app/notification/dto/request/admin_broadcast.request.ts`
- `src/modules/app/notification/dto/response/admin_broadcast.response.ts`

**Files Modified:**
- `src/modules/app/notification/notification.controller.ts` - Added endpoint
- `src/modules/app/notification/notification.service.ts` - Added SendAdminBroadcastNotification method

---

### 4. Admin Notifications for New Orders

**File Modified:** `src/modules/app/customer/customer.service.ts`

Added automatic notifications to all admins when regular orders are created:

```typescript
private async notifyAdminsNewOrder(orderId: string, customer: User): Promise<void> {
    // Get all admin users
    const adminUsers = await this._dbService.user.findMany({
        where: { type: 'ADMIN' },
        select: { id: true },
    });

    const adminIds = adminUsers.map((admin) => admin.id);

    // Send multilingual push notifications
    await this._notificationService.SendMultilingualNotificationToMultipleUsers(
        adminIds,
        'NEW_REGULAR_ORDER',
        {
            orderId: orderId,
            key: 'FETCH_ORDERS',
            route: 'Orders',
        },
    );

    // Create in-app notifications
    await this._notificationService.CreateInAppNotificationsForMultipleUsers(
        adminIds,
        'ORDER_PLACED',
        `New order from ${customer.firstName || ''} ${customer.lastName || ''}`,
        orderId,
        { orderId, key: 'FETCH_ORDERS', route: 'Orders' },
    );
}
```

This is automatically called in the `CreateOrder` method after order creation.

---

### 5. Improved i18n Error Handling

**File Modified:** `src/core/exceptions/http.exception.ts`

**Fixed Issues:**
- Now properly handles both string and object exception responses
- Better translation key matching
- Added fallback logic for missing translations

**Changes:**
```typescript
// Before
const ResponseToSend = {
    message: this.i18n.translate(exceptionResponse.key || 'errors.unindentified', {
        lang: locale,
        args: exceptionResponse.data,
    }),
    data: exceptionResponse?.data || undefined,
};

// After
let translationKey = 'errors.unidentified';
let translationArgs = {};
let responseData = undefined;

// Handle case where exceptionResponse is a string
if (typeof exceptionResponse === 'string') {
    translationKey = exceptionResponse;
} else if (typeof exceptionResponse === 'object') {
    translationKey = exceptionResponse.key || exceptionResponse.message || 'errors.unidentified';
    translationArgs = exceptionResponse.data || {};
    responseData = exceptionResponse.data;
}

const ResponseToSend = {
    message: this.i18n.translate(translationKey, {
        lang: locale,
        args: translationArgs,
    }),
    data: responseData,
};
```

**Translation Files Updated:**
- `src/i18n/en/common.json` - Added `errors.unidentified` key
- `src/i18n/ar/common.json` - Added `errors.unidentified` key
- `src/i18n/en/user.json` - Added `user.language_updated_successfully`
- `src/i18n/ar/user.json` - Added `user.language_updated_successfully`

---

## Testing Endpoints

### 1. Update User Language Preference
```bash
curl -X PATCH http://localhost:3000/v1/user/preferred-language \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"preferredLanguage": "ar"}'
```

### 2. Admin Broadcast to All Active Users
```bash
curl -X POST http://localhost:3000/v1/notification/admin/broadcast \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titleEn": "Special Offer",
    "bodyEn": "Get 20% off!",
    "titleAr": "عرض خاص",
    "bodyAr": "احصل على خصم 20%!",
    "actionType": "ORDERS",
    "route": "Orders"
  }'
```

### 3. Admin Broadcast to Filtered Users
```bash
curl -X POST http://localhost:3000/v1/notification/admin/broadcast \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titleEn": "Thank You!",
    "bodyEn": "Thanks for being a loyal customer!",
    "titleAr": "شكراً لك!",
    "bodyAr": "شكراً لكونك عميلاً مخلصاً!",
    "userTypes": ["USER"],
    "minOrderCount": 5,
    "actionType": "PROMOTIONS"
  }'
```

---

## Integration Guide for Other Services

### Using Multilingual Notifications in Your Service

1. **Inject NotificationService:**
```typescript
constructor(
    private _notificationService: NotificationService,
) {}
```

2. **Send notification to single user:**
```typescript
await this._notificationService.SendMultilingualNotificationToUser(
    userId,
    'TEMPLATE_KEY',  // Use keys from NOTIFICATION_TEMPLATES
    {
        orderId: orderId,
        key: 'ACTION_KEY',
        route: 'ScreenName',
    }
);
```

3. **Send notification to multiple users:**
```typescript
await this._notificationService.SendMultilingualNotificationToMultipleUsers(
    userIds,
    'TEMPLATE_KEY',
    {
        orderId: orderId,
        key: 'ACTION_KEY',
        route: 'ScreenName',
    }
);
```

### Available Template Keys
- `ORDER_PLACED`
- `ORDER_ACCEPTED`
- `ORDER_REJECTED`
- `ORDER_IN_PROGRESS`
- `ORDER_READY_FOR_PICKUP`
- `ORDER_PICKED_UP`
- `ORDER_DELIVERED`
- `PAYMENT_CONFIRMED`
- `NEW_ORDER` (for vendors)
- `NEW_PAID_ORDER` (for vendors)
- `NEW_CUSTOM_ORDER` (for admins)
- `NEW_REGULAR_ORDER` (for admins)
- `NEW_PICKUP_REQUEST` (for riders)
- `NEW_DELIVERY_REQUEST` (for riders)

---

## Summary of Files Changed

### Created:
1. `prisma/migrations/20251209000000_add_user_preferred_language/migration.sql`
2. `src/modules/app/notification/notification.templates.ts`
3. `src/modules/app/notification/dto/request/admin_broadcast.request.ts`
4. `src/modules/app/notification/dto/response/admin_broadcast.response.ts`
5. `src/modules/app/user/dto/request/update_preferred_language.request.ts`
6. `src/modules/app/user/dto/response/update_preferred_language.response.ts`

### Modified:
1. `prisma/schema.prisma` - Added preferredLanguage field
2. `src/modules/app/user/user.controller.ts` - Added language update endpoint
3. `src/modules/app/user/user.service.ts` - Added UpdatePreferredLanguage method
4. `src/modules/app/notification/notification.service.ts` - Added multilingual methods
5. `src/modules/app/notification/notification.controller.ts` - Added broadcast endpoint
6. `src/modules/app/customer/customer.service.ts` - Added admin notifications
7. `src/core/exceptions/http.exception.ts` - Fixed error handling
8. `src/i18n/en/common.json` - Added translations
9. `src/i18n/ar/common.json` - Added translations
10. `src/i18n/en/user.json` - Added translations
11. `src/i18n/ar/user.json` - Added translations

---

## Deployment Checklist

- [ ] Run database migration: `npm run db:deploy`
- [ ] Generate Prisma client: `npm run db:generate`
- [ ] Build application: `npm run build`
- [ ] Restart application
- [ ] Test language preference endpoint
- [ ] Test admin broadcast endpoint
- [ ] Verify existing orders trigger admin notifications
- [ ] Update API documentation

---

## Notes

- Existing locale-based translations for laundry/service fields remain unchanged
- Only push notifications use the user's preferred language
- In-app notifications are stored in English but can be translated on the frontend
- Admin broadcast requires admin role authentication
- All filters are optional - omitting them sends to all active users
