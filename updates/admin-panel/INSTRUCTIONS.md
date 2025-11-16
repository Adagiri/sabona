# Admin Panel Updates V2 - Instructions

## 🎯 Changes Overview

1. **FIX:** Items page now filters by categoryId (CRITICAL BUG FIX)
2. **Reorganize Sidebar** with proper sections
3. **Add Drag & Drop UI** for Services page
4. **Add Drag & Drop UI** for Items page
5. **Update hooks** for single-item order changes

---

## 📝 Step-by-Step Instructions

### 1. FIX Items Page - Filter by Category (CRITICAL)

**File:** `src/pages/LaundryServiceItems.tsx`

**Change 1:** Update useParams to include categoryId (line 110)
```typescript
// OLD:
const { laundryId, serviceId } = useParams<{
  laundryId: string;
  serviceId: string;
}>();

// NEW:
const { laundryId, serviceId, categoryId } = useParams<{
  laundryId: string;
  serviceId: string;
  categoryId: string;
}>();
```

**Change 2:** Filter items by categoryId (find where items are displayed)
```typescript
// Add this filter:
const filteredItems = items?.data?.filter(
  (item: any) => item.categoryId === categoryId
) || [];

// Then use `filteredItems` instead of `items?.data` in your map/display logic
```

**OR** (Better approach): Update the fetch hook to accept categoryId and filter on backend.

**Complete fixed file available in:** `files/LaundryServiceItems.tsx`

### 2. Reorganize Sidebar with All Sections

**File:** `src/components/Sidebar.tsx`
**Action:** Replace entire file with `files/sidebar-sections/Sidebar-Organized.tsx`

**New structure:**
- Dashboard (top-level)
- **Orders** Section: Orders, Custom Orders
- **Users** Section: Customers, Vendors, Drivers
- **Laundry** Section: Laundry, Categories, Icons
- **Finance** Section: Vouchers, Tips, Pre-Withdrawals, Withdrawals
- **System** Section: Applications, Map Stats, Settings

### 3. Add Drag & Drop to Services Page

**File:** `src/pages/LaundryServices.tsx`
**Action:** Replace entire file with `files/LaundryServices-DragDrop.tsx`

**Features added:**
- Visual drag handles
- Live reordering
- Optimistic updates
- Error handling
- Loading states

### 4. Add Drag & Drop to Items Page

**File:** `src/pages/LaundryServiceItems.tsx`
**Action:** Replace entire file with `files/LaundryServiceItems-DragDrop.tsx`

**Features added:**
- Category-scoped drag & drop
- Visual drag handles
- Live reordering
- Breadcrumb with category name
- Filtered by categoryId

### 5. Update Hooks for Single-Item Order Changes

**File:** `src/hooks/Admin/laundryHooks.ts`
**Location:** After existing reorder hooks
**Action:** Add content from `files/single-item-order-hooks.ts`

Adds:
- `useChangeLaundryServiceOrder()`
- `useChangeLaundryServiceItemOrder()`

---

## ✅ Verification Checklist

- [ ] Items page extracts categoryId from route params
- [ ] Items are filtered by selected category
- [ ] Sidebar has organized sections (all collapsible)
- [ ] Services page has drag & drop handles
- [ ] Items page has drag & drop handles
- [ ] Dragging reorders items visually
- [ ] Order persists after page refresh
- [ ] No TypeScript errors
- [ ] App compiles successfully

---

## 🧪 Testing Steps

1. **Test Items Filtering:**
   - Navigate: Laundry → Services → Categories → Select Category
   - Should show ONLY items for that service+category combination
   - Not all items for the service

2. **Test Sidebar:**
   - All sections should be collapsible
   - Active section should auto-expand
   - Proper grouping of related features

3. **Test Services Drag & Drop:**
   - Go to a laundry's services page
   - Drag a service up/down
   - Order should update immediately
   - Refresh page - order should persist

4. **Test Items Drag & Drop:**
   - Go to service → category → items
   - Drag an item up/down
   - Order should update immediately
   - Refresh page - order should persist
   - Items only reorder within their category

---

## 📌 Important Notes

- **Items ordering is category-scoped** - items can only be reordered within their own service+category
- **Drag handles** appear on hover for better UX
- **Optimistic updates** make UI feel instant
- **Error handling** shows toast notifications on failure
- **Loading states** prevent double-clicks during reordering

---

## 🚀 Deployment

```bash
git add -A
git commit -m "fix: Filter items by category and add drag-and-drop UI"
git push
```
