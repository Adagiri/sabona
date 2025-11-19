# Updates-1: Express Vendor Pricing, Withdrawal Improvements & Admin Dashboard

This update adds:
1. Separate pricing for normal and express delivery types
2. Deletion protection for resources with dependencies
3. Improved withdrawal calculations with configurable transfer charges
4. Rich admin dashboard with metrics and statistics
5. Finance page with inflow/outflow tracking

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

---

## Withdrawal System Improvements

### New Features

1. **Configurable Transfer Charge**
   - Can be PERCENTAGE (e.g., 1%) or FIXED (e.g., 1 SAR)
   - Configured from Admin Panel → Admin Settings

2. **Express/Normal Pricing Support**
   - Vendor earnings now use correct price based on delivery type
   - Express orders use `expressVendorPriceSnapshot`
   - Normal orders use `vendorPriceSnapshot`

3. **Disbursement Tracking**
   - New `vendorEarningDisbursed` field on Order
   - Orders marked as disbursed when invoice uploaded

### New Database Fields

**AdminSettings**:
- `transferChargeType` - PERCENTAGE or FIXED
- `transferChargeRate` - Rate value (default 1.0)

**Order**:
- `vendorEarningDisbursed` - Boolean (default false)
- `disbursedAt` - Timestamp when marked disbursed
- `withdrawalId` - Link to withdrawal

**WithdrawalLaundry**:
- `grossEarnings` - Gross vendor earning
- `serviceCharge` - Platform's service charge
- `transferCharge` - Transfer fee deducted

### Files to Apply

1. Run migration: `prisma/migrations/20241119_withdrawal_improvements/migration.sql`
2. Apply withdrawal service changes: `src/modules/app/withdrawal/withdrawal-improvements.changes.md`

---

## Admin Dashboard

### Features

- **Key Metrics**: Total revenue, orders, customers, active laundries
- **Platform Earnings**: Service charges, delivery fees, VAT collected
- **Order Statistics**: Completion rate, cancellation rate, delivery types
- **Revenue Trends**: 30-day line chart
- **Order Status Distribution**: Pie chart
- **Top Performing Laundries**: Table with order count and revenue
- **Recent Orders**: Latest 10 orders with status

### Backend Files

- `src/modules/app/admin/dashboard.service.ts`
- `src/modules/app/admin/admin-dashboard.controller.ts`

### Admin Panel Files

- `src/pages/Dashboard.tsx` (replaces empty Home.tsx)

### API Endpoints

- `GET /admin/dashboard/metrics` - All dashboard data
- `GET /admin/dashboard/trends?days=30` - Order trends

---

## Finance Page

### Features

- **Summary Cards**: Total inflow, outflow, net cashflow, platform profit
- **Inflow Breakdown**: Revenue, service charges, delivery fees, VAT, transfer charges
- **Outflow Breakdown**: Vendor earnings, completed/pending withdrawals
- **Platform Gains**: Item markup, service charges, delivery fees, net profit
- **Monthly Breakdown**: Bar chart and table with yearly data
- **Vendor Earnings Report**: Per-laundry earnings with disbursement status
- **Daily Revenue**: 30-day trend with breakdown

### Backend Files

- `src/modules/app/admin/finance.service.ts`

### Admin Panel Files

- `src/pages/Finance.tsx`

### API Endpoints

- `GET /admin/dashboard/finance/overview?startDate=&endDate=`
- `GET /admin/dashboard/finance/monthly?year=`
- `GET /admin/dashboard/finance/vendor-earnings?startDate=&endDate=`
- `GET /admin/dashboard/finance/daily-revenue?days=30`

---

## Admin Settings Updates

### New Transfer Charge Configuration

Added to Admin Settings page:
- Transfer Charge Type (Percentage/Fixed)
- Transfer Charge Rate

### Files to Apply

- `src/pages/AdminSettings.tsx` (updated version)

Also update the mutation/query hooks to include new fields:
- `transferChargeType`
- `transferChargeRate`

---

## Complete File List

### Backend

| File | Action |
|------|--------|
| `prisma/migrations/20241118_add_express_pricing/migration.sql` | Run |
| `prisma/migrations/20241119_withdrawal_improvements/migration.sql` | Run |
| `src/modules/app/vendor/dto/request/*.ts` | Copy |
| `src/modules/app/order/dto/response/getOrderById.response.ts` | Copy |
| `src/constants/laundry-template.ts` | Copy |
| `src/modules/app/admin/dashboard.service.ts` | Copy (new) |
| `src/modules/app/admin/finance.service.ts` | Copy (new) |
| `src/modules/app/admin/admin-dashboard.controller.ts` | Copy (new) |
| `src/modules/app/withdrawal/withdrawal-improvements.changes.md` | Apply |
| `src/modules/app/vendor/deletion-protection.changes.md` | Apply |

### Admin Panel

| File | Action |
|------|--------|
| `src/pages/LaundryServiceItems.tsx` | Copy |
| `src/pages/OrderDetails.tsx` | Copy |
| `src/pages/AdminSettings.tsx` | Copy |
| `src/pages/Dashboard.tsx` | Copy (new) |
| `src/pages/Finance.tsx` | Copy (new) |
| `deletion-error-handling.changes.md` | Apply |

### Integration Notes

1. Add Dashboard and Finance routes to router
2. Update navigation menu with Dashboard and Finance links
3. Register dashboard and finance services in module
4. Install recharts for charts: `npm install recharts`
5. Install date-pickers if not present: `npm install @mui/x-date-pickers date-fns`
