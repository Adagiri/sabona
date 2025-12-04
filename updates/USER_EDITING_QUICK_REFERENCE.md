# Quick Reference - User Editing Feature

## Backend Session Instructions

**Say to your backend Claude session:**

> I need you to implement a user profile editing feature with audit trail. The files are in `/home/user/soaps/updates/backend/`. Please:
>
> 1. Copy these files to the backend:
>    - `schema.prisma` → `prisma/schema.prisma`
>    - `validation.helper.ts` → `src/helpers/validation.helper.ts`
>    - `editUser.request.ts` → `src/modules/app/admin/dto/request/editUser.request.ts`
>    - `editUser.response.ts` → `src/modules/app/admin/dto/response/editUser.response.ts`
>    - `admin.controller.ts` → `src/modules/app/admin/admin.controller.ts`
>    - `admin.service.ts` → `src/modules/app/admin/admin.service.ts`
>    - `20251204000000_add_user_change_logs/` → `prisma/migrations/20251204000000_add_user_change_logs/`
>
> 2. Run: `npm run db:migrate && npm run db:generate && npm run start:dev`
>
> Read `/home/user/soaps/updates/backend/USER_EDITING_INSTRUCTIONS.md` for full details.

---

## Admin Panel Session Instructions

**Say to your admin panel Claude session:**

> I need you to add a reusable DataTable component and user editing UI. The files are in `/home/user/soaps/updates/admin-panel/`. Please:
>
> 1. Copy these files to the admin panel:
>    - `DataTable.tsx` → `src/components/DataTable.tsx`
>    - `EditUserDialog.tsx` → `src/components/EditUserDialog.tsx`
>    - `users.ts` → `src/hooks/Admin/mutations/users.ts`
>    - `Customer.tsx` → `src/pages/Customer.tsx`
>
> 2. Run: `npm run dev`
>
> Read `/home/user/soaps/updates/admin-panel/USER_EDITING_INSTRUCTIONS.md` for full details.

---

## What This Feature Does

### Backend
✅ Edit user: name, email, phone, status, level
✅ Phone change requires mandatory reason
✅ Email change with optional reason
✅ Saudi phone number validation (+966, 966, 05, 5 formats)
✅ Email validation (RFC 5322)
✅ Audit trail (PhoneChangeLog + EmailChangeLog tables)
✅ Push notifications to users
✅ Cannot edit admin users
✅ Level only for customers
✅ Respects partial index for phone uniqueness

### Frontend
✅ Reusable DataTable component with:
  - Horizontal scroll + fixed actions column
  - Sticky header
  - Column visibility toggles
✅ Edit User Dialog with:
  - Form for name, email, phone, status, level
  - Phone change confirmation with reason
  - Email change with optional reason
  - Real-time validation
✅ Updated Customer page using new components

---

## API Endpoints Created

```
PATCH /api/v1/admin/users/:userId/edit
POST  /api/v1/admin/users/:userId/change-phone
POST  /api/v1/admin/users/:userId/change-email
```

---

## Database Changes

**New Tables:**
- `PhoneChangeLog` - Tracks all phone changes with reasons
- `EmailChangeLog` - Tracks all email changes with reasons

**Migration:** `20251204000000_add_user_change_logs`

---

## Files Added/Modified

### Backend (7 files)
- ✅ `prisma/schema.prisma` (modified)
- ✅ `src/helpers/validation.helper.ts` (new)
- ✅ `src/modules/app/admin/dto/request/editUser.request.ts` (new)
- ✅ `src/modules/app/admin/dto/response/editUser.response.ts` (new)
- ✅ `src/modules/app/admin/admin.service.ts` (modified)
- ✅ `src/modules/app/admin/admin.controller.ts` (modified)
- ✅ `prisma/migrations/20251204000000_add_user_change_logs/` (new)

### Admin Panel (4 files)
- ✅ `src/components/DataTable.tsx` (new)
- ✅ `src/components/EditUserDialog.tsx` (new)
- ✅ `src/hooks/Admin/mutations/users.ts` (new)
- ✅ `src/pages/Customer.tsx` (modified)

---

## Testing

### Backend
```bash
# Test edit user
curl -X PATCH http://localhost:3000/api/v1/admin/users/{userId}/edit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","status":"ACTIVE","level":"LOYAL"}'

# Test phone change
curl -X POST http://localhost:3000/api/v1/admin/users/{userId}/change-phone \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"newPhone":"+966501234567","reason":"Lost SIM card"}'
```

### Frontend
1. Navigate to Customers page
2. Click column toggle button (top right)
3. Try horizontal scroll if needed
4. Click Edit icon on a row
5. Change name, phone (with reason), or status
6. Save and verify changes

---

## Key Features

| Feature | Backend | Frontend |
|---------|---------|----------|
| Edit name | ✅ | ✅ |
| Edit email | ✅ | ✅ |
| Edit phone | ✅ | ✅ |
| Edit status | ✅ | ✅ |
| Edit level (customers only) | ✅ | ✅ |
| Phone requires reason | ✅ | ✅ |
| Email optional reason | ✅ | ✅ |
| Saudi phone validation | ✅ | ✅ |
| Email validation | ✅ | ✅ |
| Audit trail | ✅ | - |
| Push notifications | ✅ | - |
| Cannot edit admins | ✅ | ✅ |
| Column toggles | - | ✅ |
| Sticky actions column | - | ✅ |
| Horizontal scroll | - | ✅ |

---

## Next Steps

After implementing this feature:

1. **Apply DataTable to other lists:**
   - Driver.tsx (riders)
   - Vendor.tsx (vendors)
   - Order.tsx (orders)
   - Laundry.tsx (laundries)
   - Application.tsx (applications)

2. **Test thoroughly:**
   - Verify phone uniqueness
   - Test with deleted users
   - Check audit logs
   - Verify notifications

3. **Monitor:**
   - Check database logs
   - Watch for validation errors
   - Review user feedback

---

## Support

For detailed implementation steps and troubleshooting:
- Backend: `updates/backend/USER_EDITING_INSTRUCTIONS.md`
- Frontend: `updates/admin-panel/USER_EDITING_INSTRUCTIONS.md`
