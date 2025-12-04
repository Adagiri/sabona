# Quick Reference - File Copy Instructions

## Files to Copy - Backend

Copy these files from `updates/backend/` to your backend repository:

```bash
# From the updates/backend folder, copy to backend repository:

updates/backend/schema.prisma
→ backend/prisma/schema.prisma

updates/backend/admin.controller.ts
→ backend/src/modules/app/admin/admin.controller.ts

updates/backend/adminCustomOrder.service.ts
→ backend/src/modules/app/admin/adminCustomOrder.service.ts

updates/backend/20251122000000_add_payment_link_date_created/
→ backend/prisma/migrations/20251122000000_add_payment_link_date_created/
```

### Backend Commands After Copying

```bash
cd backend
npm run db:migrate        # Apply database migration
npm run db:generate       # Regenerate Prisma client
npm run start:dev         # Restart server
```

---

## Files to Copy - Admin Panel

Copy these files from `updates/admin-panel/` to your admin-panel repository:

```bash
# From the updates/admin-panel folder, copy to admin-panel repository:

updates/admin-panel/customOrders.ts
→ admin-panel/src/hooks/Admin/mutations/customOrders.ts

updates/admin-panel/CustomOrderDetails.tsx
→ admin-panel/src/pages/CustomOrderDetails.tsx
```

### Admin Panel Commands After Copying

```bash
cd admin-panel
npm run dev              # Restart development server
# OR
npm run build            # Build for production
```

---

## Key Changes Summary

### Backend Changes
- ✅ Added `payTabsInvoiceDateCreated` field to Order model
- ✅ Created `regeneratePaymentLink()` service method
- ✅ Added POST endpoint: `/admin/custom-order/:orderId/regenerate-payment-link`
- ✅ Database migration for new field

### Frontend Changes
- ✅ Added `useRegeneratePaymentLink()` mutation hook
- ✅ Added "Regenerate Payment Link" button with countdown timer
- ✅ Shows payment link creation timestamp
- ✅ Handles all error states with clear messages

---

## Testing the Feature

### Backend Test
```bash
# Use your API client (Postman, curl, etc.)
POST http://localhost:3000/api/v1/admin/custom-order/{orderId}/regenerate-payment-link
Headers:
  Authorization: Bearer {your_admin_token}
```

### Frontend Test
1. Open browser to admin panel
2. Navigate to Custom Orders → Select an order with payment link
3. Scroll to "Customer Payment Invoice" section
4. Look for "Regenerate Payment Link" button
5. Button should show countdown if < 20 minutes, or be enabled if ≥ 20 minutes

---

## What the Feature Does

**Admin can regenerate payment links for custom orders when:**
- ❌ Payment link is older than 20 minutes
- ❌ Payment has NOT been received yet

**The system will:**
1. Generate a new PayTabs payment link
2. Update the order with new link and timestamp
3. Send push notification to customer
4. Log admin activity
5. Show success message in UI

**Restrictions:**
- ⏱️ Must wait 20 minutes between regenerations
- 💰 Cannot regenerate if payment already received
- 🔗 Must have existing payment link to regenerate

---

## Need Help?

- **Backend Details:** See `updates/backend/IMPLEMENTATION_INSTRUCTIONS.md`
- **Frontend Details:** See `updates/admin-panel/IMPLEMENTATION_INSTRUCTIONS.md`
- **Full Overview:** See `updates/README.md`
