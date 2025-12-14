# Quick Implementation Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy new service and controller
cp ../updates4/backend/code/src/modules/app/admin/admin.service.ts \
   src/modules/app/admin/adminOrderManagement.service.ts

cp ../updates4/backend/code/src/modules/app/admin/admin.controller.ts \
   src/modules/app/admin/adminOrderManagement.controller.ts

# Copy DTOs
cp -r ../updates4/backend/code/src/modules/app/admin/dto/* \
      src/modules/app/admin/dto/
```

### Step 2: Register Services

Edit `src/modules/app/admin/admin.module.ts`:

```typescript
import AdminOrderManagementService from './adminOrderManagement.service';
import AdminOrderManagementController from './adminOrderManagement.controller';

@Module({
  controllers: [
    AdminController,
    AdminDashboardController,
    AdminOrderManagementController,  // ADD THIS
  ],
  providers: [
    AdminService,
    AdminCustomOrderService,
    AdminOrderManagementService,      // ADD THIS
    // ... other providers
  ],
})
export class AdminModule {}
```

### Step 3: Database Migration

Add to `prisma/schema.prisma` (if field doesn't exist):

```prisma
model Order {
  // ... existing fields
  adminNotes  String?  @db.Text
}
```

Run migration:

```bash
npx prisma migrate dev --name add_admin_notes_to_orders
```

### Step 4: Frontend Setup

```bash
# Navigate to admin panel
cd ../admin-panel

# Copy mutation files
cp ../updates4/admin-panel/src/hooks/Admin/mutations/orders.ts \
   src/hooks/Admin/mutations/

cp ../updates4/admin-panel/src/hooks/Admin/mutations/customOrders.ts \
   src/hooks/Admin/mutations/

# Backup and replace OrderDetails page
cp src/pages/OrderDetails.tsx src/pages/OrderDetails.tsx.backup
cp ../updates4/admin-panel/src/pages/OrderDetails.tsx \
   src/pages/
```

### Step 5: Restart Services

```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd admin-panel
npm run dev
```

---

## ✅ Verification

### Test Endpoint Availability

```bash
# Health check - should return 200
curl http://localhost:3000/api/v1/admin/order/test123/driver-accept-pickup \
  -H "Authorization: Bearer <your-admin-token>"

# Expected: 400 Bad Request (order not found) - this confirms endpoint exists
```

### Test in Admin Panel

1. Navigate to any order details page
2. Verify you see quick action buttons based on order status
3. Try accepting an order (if PENDING)
4. Try adding admin notes
5. Verify all actions show loading states and success toasts

---

## 🎯 What You Get

### Backend
- 8 new admin endpoints for order management
- Complete order flow management on behalf of vendors and drivers
- Admin notes functionality
- Comprehensive notifications

### Frontend
- Dynamic quick action buttons
- Real-time status updates
- Loading states and error handling
- Toast notifications for all actions

---

## 🐛 Troubleshooting

### Error: "Module not found"
**Solution**: Ensure all imports in the new files match your project structure

### Error: "adminNotes field not found"
**Solution**: Run the Prisma migration for adding adminNotes field

### Error: "Unauthorized"
**Solution**: Ensure you're logged in as admin and token is valid

### Frontend: Mutations not working
**Solution**: Check that API base URL is correct in `api-service.ts`

---

## 📊 Quick Test Script

Create a test file `test-admin-endpoints.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000/api/v1"
ADMIN_TOKEN="your-admin-token-here"
ORDER_ID="your-test-order-id"

echo "Testing Admin Order Endpoints..."

# Test 1: Accept Pickup Ride
echo "\n1. Accept Pickup Ride"
curl -X PATCH "$API_URL/admin/order/$ORDER_ID/driver-accept-pickup" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Test 2: Mark Picked Up
echo "\n\n2. Mark Picked Up"
curl -X PATCH "$API_URL/admin/order/$ORDER_ID/driver-picked-up" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Test 3: Mark Dropped at Vendor
echo "\n\n3. Mark Dropped at Vendor"
curl -X PATCH "$API_URL/admin/order/$ORDER_ID/driver-dropped-at-vendor" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Test 4: Mark Ready
echo "\n\n4. Mark Ready for Delivery"
curl -X PATCH "$API_URL/admin/order/$ORDER_ID/mark-ready" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Test 5: Add Notes
echo "\n\n5. Add Admin Notes"
curl -X PATCH "$API_URL/admin/order/$ORDER_ID/notes" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Test note from admin"}'

echo "\n\nTests completed!"
```

Run it:
```bash
chmod +x test-admin-endpoints.sh
./test-admin-endpoints.sh
```

---

## 📝 Common Use Cases

### Use Case 1: Complete an Order Manually

**Scenario**: Driver is unavailable, admin needs to complete order flow

```
1. Admin accepts order (on behalf of vendor)
2. Admin accepts pickup ride (on behalf of driver)
3. Admin marks picked up (on behalf of driver)
4. Admin marks dropped at vendor (on behalf of driver)
5. Admin marks ready (on behalf of vendor)
6. Admin accepts delivery ride (on behalf of driver)
7. Admin marks delivered (on behalf of driver)
```

### Use Case 2: Add Internal Notes

**Scenario**: Customer calls with special request

```
1. Navigate to order details
2. Click "Add Notes"
3. Enter: "Customer requested contactless delivery"
4. Save
→ Note appears with timestamp and admin name
```

### Use Case 3: Handle Stuck Orders

**Scenario**: Order stuck in ACCEPTED status, driver hasn't confirmed

```
1. Check order status and pickup status
2. Click "Accept Pickup Ride (Driver)"
→ Pickup confirmed on behalf of driver
→ Customer and vendor notified
```

---

## 🎨 Customization Options

### Change Button Colors

Edit `OrderDetails.tsx`:

```typescript
const nextActions = getNextActions();
// Colors: 'success', 'primary', 'info', 'warning', 'error'
```

### Modify Notifications

Edit `admin.service.ts` notification messages:

```typescript
await this._notificationService.SendNotificationToMultipleTokens({
  tokens: customerTokens,
  title: 'Your Custom Title',
  body: 'Your custom message',
  // ...
});
```

### Add Custom Validations

Edit `admin.service.ts` validation checks:

```typescript
if (order.status !== OrderStatus.ACCEPTED) {
  throw new BadRequestException('Custom error message');
}
```

---

## 📈 Monitoring

### Check Admin Actions

Query admin notes in database:

```sql
SELECT
  id,
  orderNumber,
  status,
  adminNotes
FROM "Order"
WHERE adminNotes IS NOT NULL
ORDER BY updatedAt DESC
LIMIT 10;
```

### Check Notification Delivery

```sql
SELECT
  o.orderNumber,
  n.type,
  n.message,
  n.status,
  n.createdAt
FROM "Notification" n
JOIN "Order" o ON n.orderId = o.id
WHERE n.message LIKE '%admin%'
ORDER BY n.createdAt DESC
LIMIT 20;
```

---

## 🔄 Rollback Instructions

If you need to rollback:

### Backend

```bash
# Remove new files
rm src/modules/app/admin/adminOrderManagement.service.ts
rm src/modules/app/admin/adminOrderManagement.controller.ts
rm -r src/modules/app/admin/dto/request/updateOrderStatus.request.ts
rm -r src/modules/app/admin/dto/response/updateOrderStatus.response.ts

# Revert admin module registration (manual)
# Revert database migration
npx prisma migrate revert
```

### Frontend

```bash
# Restore backup
mv src/pages/OrderDetails.tsx.backup src/pages/OrderDetails.tsx

# Remove new mutation files
rm src/hooks/Admin/mutations/orders.ts

# Restore original customOrders.ts from git
git checkout src/hooks/Admin/mutations/customOrders.ts
```

---

**Need Help?** Check the main README.md for detailed documentation.
