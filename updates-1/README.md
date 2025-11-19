# Updates-1: Express Vendor Pricing & Deletion Protection

This update adds:
1. Separate pricing for normal and express delivery types
2. Deletion protection for resources with dependencies

## Summary of Changes

### New Fields Structure

**LaundryServiceItem** now has 4 price fields:
- `vendorPrice` - What vendor receives (normal delivery)
- `platformPrice` - What user pays (normal delivery)
- `expressVendorPrice` - What vendor receives (express delivery)
- `expressPlatformPrice` - What user pays (express delivery)

**OrderLaundryServiceItem** snapshots:
- `vendorPriceSnapshot` - Vendor price at order time (normal)
- `platformPriceSnapshot` - Platform price at order time (normal)
- `expressVendorPriceSnapshot` - Vendor price at order time (express)
- `expressPlatformPriceSnapshot` - Platform price at order time (express)

## Migration Strategy

Existing data migration formula:
```sql
expressVendorPrice = expressPrice
expressPlatformPrice = (expressPrice * platformPrice) / vendorPrice
```

## Files to Apply

### Backend

1. **Run Migration First**
   - Copy `prisma/migrations/20241118_add_express_pricing/migration.sql`
   - Run: `npx prisma migrate deploy`

2. **Update Prisma Schema**
   - Apply changes from `prisma/schema.prisma.changes.md`
   - Run: `npx prisma generate`

3. **Update DTOs**
   - Copy `src/modules/app/vendor/dto/request/createLaundryServiceItem.request.ts`
   - Copy `src/modules/app/vendor/dto/request/editlaundryServiceItem.request.ts`

4. **Update Services** (apply changes from .changes.md files)
   - Apply changes from `src/modules/app/vendor/vendor.service.ts.changes.md`
   - Apply changes from `src/modules/app/customer/customer.service.ts.changes.md`

5. **Update Response DTO**
   - Copy `src/modules/app/order/dto/response/getOrderById.response.ts`

6. **Update Template**
   - Copy `src/constants/laundry-template.ts`

### Admin Panel

1. **Update Pages**
   - Copy `src/pages/LaundryServiceItems.tsx`
   - Copy `src/pages/OrderDetails.tsx`

## Backward Compatibility

The API maintains backward compatibility by mapping:
- `expressPrice = expressPlatformPrice` in responses

This ensures the mobile app continues to work without changes.

---

## Deletion Protection

### Protected Resources

Resources cannot be deleted if they have **active** dependencies:

| Resource | Cannot Delete If Has |
|----------|---------------------|
| **Laundry** | Active orders (not completed/cancelled/rejected), pending withdrawals |
| **LaundryService** | Active orders using this service |
| **LaundryServiceItem** | Active orders containing this item |
| **LaundryItemCategory** | Active items using it, active subcategories |
| **User** | Active orders (customer), active assignments (rider), active laundries (vendor) |

### Active Order Statuses (Block Deletion)
- `PENDING_PAYMENT`
- `PENDING`
- `ACCEPTED`
- `IN_PROGRESS`
- `READY_FOR_PICKUP`

### Final Statuses (Allow Deletion)
- `COMPLETED`
- `CANCELLED`
- `REJECTED`

### Cascade Deletions
- **Laundry** → Soft-deletes services → Soft-deletes items
- **Service** → Soft-deletes items

### Error Messages

When deletion is blocked, users see clear messages like:
- "Cannot delete laundry - it has 3 active order(s). Complete or cancel them first."
- "Cannot delete service - it is used in 2 active order(s). Complete or cancel them first."
- "Cannot delete item - it is in 1 active order(s). Complete or cancel them first."

### Files to Apply

- Apply changes from `src/modules/app/vendor/deletion-protection.changes.md`

### Testing Checklist (Deletion Protection)

- [ ] Try deleting laundry with active orders (should fail)
- [ ] Try deleting laundry with active services (should fail)
- [ ] Try deleting service with active items (should fail)
- [ ] Try deleting item referenced in orders (should fail)
- [ ] Try deleting category with items using it (should fail)
- [ ] Delete resources with no dependencies (should succeed)
- [ ] Delete resources where dependencies are soft-deleted (should succeed)

## Testing Checklist

- [ ] Run migration on database
- [ ] Generate Prisma client
- [ ] Test item creation with 4 price fields
- [ ] Test item editing
- [ ] Test order creation captures all snapshots
- [ ] Test order details displays snapshot values
- [ ] Verify mobile app still works (backward compatibility)
