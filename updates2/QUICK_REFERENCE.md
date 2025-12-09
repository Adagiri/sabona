# Quick Reference Guide - Multilingual Notifications

## API Endpoints

### 1. Update User Language Preference

```
PATCH /v1/user/preferred-language
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json
```

**Request:**
```json
{
  "preferredLanguage": "ar"
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

---

### 2. Admin Broadcast Notification

```
POST /v1/notification/admin/broadcast
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json
```

**Request (Minimal):**
```json
{
  "titleEn": "Special Offer",
  "bodyEn": "Get 20% off!",
  "titleAr": "عرض خاص",
  "bodyAr": "احصل على خصم 20%!"
}
```

**Request (With Filters):**
```json
{
  "titleEn": "Special Offer",
  "bodyEn": "Get 20% off!",
  "titleAr": "عرض خاص",
  "bodyAr": "احصل على خصم 20%!",
  "actionType": "ORDERS",
  "route": "Orders",
  "userTypes": ["USER"],
  "minOrderCount": 5,
  "registrationStartDate": "2024-01-01T00:00:00Z",
  "registrationEndDate": "2024-12-31T23:59:59Z"
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

---

## Filter Options

### User Types
- `USER` - Customers
- `VENDOR` - Laundry vendors
- `RIDER` - Delivery riders

### Action Types
- `ORDERS` - Opens orders page
- `PROFILE` - Opens profile page
- `HOME` - Opens home page
- `PROMOTIONS` - Opens promotions page

### Filters
| Filter | Type | Description |
|--------|------|-------------|
| `userTypes` | Array | Filter by user type |
| `registrationStartDate` | ISO 8601 | Users registered after this date |
| `registrationEndDate` | ISO 8601 | Users registered before this date |
| `minOrderCount` | Number | Minimum orders placed |
| `maxOrderCount` | Number | Maximum orders placed |

---

## Database Schema

```prisma
model User {
  // ... existing fields
  preferredLanguage String? @default("en") // "en" or "ar"
}
```

---

## Migration

```sql
ALTER TABLE "User" ADD COLUMN "preferredLanguage" TEXT DEFAULT 'en';
```

Deploy:
```bash
npm run db:deploy
```

---

## Notification Templates

### Available Keys
```typescript
'ORDER_PLACED'
'ORDER_ACCEPTED'
'ORDER_REJECTED'
'ORDER_IN_PROGRESS'
'ORDER_READY_FOR_PICKUP'
'ORDER_PICKED_UP'
'ORDER_DELIVERED'
'PAYMENT_CONFIRMED'
'NEW_ORDER'
'NEW_PAID_ORDER'
'NEW_CUSTOM_ORDER'
'NEW_REGULAR_ORDER'
'NEW_PICKUP_REQUEST'
'NEW_DELIVERY_REQUEST'
```

### Usage in Code
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

---

## Quick Test Commands

**Update language to Arabic:**
```bash
curl -X PATCH http://localhost:3000/v1/user/preferred-language \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"preferredLanguage": "ar"}'
```

**Send broadcast to all:**
```bash
curl -X POST http://localhost:3000/v1/notification/admin/broadcast \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titleEn": "Test",
    "bodyEn": "Test message",
    "titleAr": "اختبار",
    "bodyAr": "رسالة اختبار"
  }'
```

**Send to loyal customers (5+ orders):**
```bash
curl -X POST http://localhost:3000/v1/notification/admin/broadcast \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titleEn": "Thank You!",
    "bodyEn": "Enjoy 15% off",
    "titleAr": "شكراً لك!",
    "bodyAr": "استمتع بخصم 15%",
    "userTypes": ["USER"],
    "minOrderCount": 5
  }'
```

---

## Common Use Cases

### 1. Welcome New Users
```json
{
  "titleEn": "Welcome! 🎉",
  "bodyEn": "Thanks for joining us!",
  "titleAr": "مرحباً! 🎉",
  "bodyAr": "شكراً لانضمامك!",
  "userTypes": ["USER"],
  "registrationStartDate": "2024-12-01T00:00:00Z",
  "maxOrderCount": 0
}
```

### 2. Re-engage Inactive Users
```json
{
  "titleEn": "We Miss You! 💙",
  "bodyEn": "Come back for 25% off!",
  "titleAr": "نحن نفتقدك! 💙",
  "bodyAr": "عد واستمتع بخصم 25%!",
  "userTypes": ["USER"],
  "registrationEndDate": "2024-06-30T23:59:59Z",
  "maxOrderCount": 2
}
```

### 3. Reward Loyal Customers
```json
{
  "titleEn": "VIP Offer! 🌟",
  "bodyEn": "20% off for loyal customers",
  "titleAr": "عرض VIP! 🌟",
  "bodyAr": "خصم 20% للعملاء المخلصين",
  "userTypes": ["USER"],
  "minOrderCount": 10
}
```

### 4. Notify Vendors
```json
{
  "titleEn": "Important Update",
  "bodyEn": "New policy changes",
  "titleAr": "تحديث مهم",
  "bodyAr": "تغييرات في السياسة",
  "userTypes": ["VENDOR"]
}
```

### 5. Motivate Riders
```json
{
  "titleEn": "Bonus Week! 🚗",
  "bodyEn": "50 deliveries = 500 SAR",
  "titleAr": "أسبوع المكافآت! 🚗",
  "bodyAr": "50 توصيلة = 500 ريال",
  "userTypes": ["RIDER"]
}
```

---

## Files Modified

### Backend
1. `prisma/schema.prisma` - Added preferredLanguage
2. `src/modules/app/user/user.controller.ts` - Language endpoint
3. `src/modules/app/user/user.service.ts` - Language update method
4. `src/modules/app/notification/notification.service.ts` - Multilingual methods
5. `src/modules/app/notification/notification.controller.ts` - Broadcast endpoint
6. `src/modules/app/customer/customer.service.ts` - Admin notifications
7. `src/core/exceptions/http.exception.ts` - Error handling
8. `src/i18n/en/*.json` & `src/i18n/ar/*.json` - Translations

### Created
1. `prisma/migrations/20251209000000_add_user_preferred_language/migration.sql`
2. `src/modules/app/notification/notification.templates.ts`
3. `src/modules/app/notification/dto/request/admin_broadcast.request.ts`
4. `src/modules/app/notification/dto/response/admin_broadcast.response.ts`
5. `src/modules/app/user/dto/request/update_preferred_language.request.ts`
6. `src/modules/app/user/dto/response/update_preferred_language.response.ts`

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid token) |
| 403 | Forbidden (not admin) |
| 500 | Internal Server Error |

---

## Troubleshooting

**No notifications received?**
- Check user has device tokens
- Verify user status is ACTIVE
- Check filters aren't too restrictive

**Wrong language?**
- Verify user's preferredLanguage in DB
- Default is 'en' if not set

**403 Forbidden?**
- Ensure user has ADMIN role
- Check token is valid

---

## Next Steps

1. Deploy database migration
2. Test endpoints
3. Implement admin panel UI
4. Update mobile app settings
5. Monitor notification delivery

---

For detailed documentation, see:
- `backend/IMPLEMENTATION_SUMMARY.md`
- `backend/API_EXAMPLES.md`
- `admin-panel/ADMIN_PANEL_REQUIREMENTS.md`
