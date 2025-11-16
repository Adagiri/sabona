# Admin Panel Updates V3 - Implementation Instructions

## 📝 Changes Summary

1. Add new hook for category-filtered items
2. Update LaundryServiceItems page to use backend filtering

---

## Step 1: Add New Hook for Category Filtering

**File:** `src/hooks/Admin/query/index.ts`

**Location:** After the existing `useFetchLaundryServiceItems` hook (around line 340)

**Add this code:**

```typescript
export const useFetchLaundryServiceItemsByCategory = (
  laundryId: string,
  serviceId: string,
  categoryId: string
) => {
  return useQuery({
    queryKey: [
      FETCH_ORDER_QUERIES.FETCH_LAUNDRY_SERVICE_ITEMS,
      laundryId,
      serviceId,
      categoryId,
    ],
    queryFn: async () => {
      const response = await api.get(
        `/admin/laundry/${laundryId}/service/${serviceId}/category/${categoryId}/items`
      );
      return response.data;
    },
    enabled: !!laundryId && !!serviceId && !!categoryId,
  });
};
```

---

## Step 2: Update LaundryServiceItems Page

**File:** `src/pages/LaundryServiceItems.tsx`

### Change 1: Update Imports (around line 61)

**Replace:**
```typescript
import {
  useFetchLaundryById,
  useFetchLaundryServiceItems,
  useFetchCategories,
} from '../hooks/Admin/query';
```

**With:**
```typescript
import {
  useFetchLaundryById,
  useFetchLaundryServiceItemsByCategory,
  useFetchCategories,
} from '../hooks/Admin/query';
```

### Change 2: Update Hook Usage (around line 249)

**Replace:**
```typescript
const {
  data: items,
  isLoading,
  error,
  refetch,
} = useFetchLaundryServiceItems(laundryId!, serviceId!);
```

**With:**
```typescript
const {
  data: items,
  isLoading,
  error,
  refetch,
} = useFetchLaundryServiceItemsByCategory(laundryId!, serviceId!, categoryId!);
```

### Change 3: Remove Frontend Filtering (around line 256)

**Replace:**
```typescript
// *** CRITICAL FIX: Filter items by categoryId ***
const filteredItems = React.useMemo(() => {
  console.log(items, categoryId)
  if (!items?.data || !categoryId) return [];
  return items.data.filter((item: ServiceItem) => item.category.id === categoryId);
}, [items?.data, categoryId]);
```

**With:**
```typescript
// Items are now filtered by backend, no need for frontend filtering
const filteredItems = items?.data || [];
```

---

## ✅ Testing

1. Navigate to: Laundry → Services → Click Service → Click Category
2. Verify only items for that category are shown
3. Check network tab - verify endpoint is:
   ```
   GET /admin/laundry/{id}/service/{id}/category/{id}/items
   ```
4. Verify no frontend filtering in console logs

---

## 🚀 Deployment

```bash
git add -A
git commit -m "feat: Use backend-filtered items endpoint for categories"
git push origin dev
```

---

## 📌 Notes

- The old `useFetchLaundryServiceItems` hook is preserved for backward compatibility
- Items are now filtered on backend, reducing data transfer
- Drag-and-drop still works with filtered items (category-scoped)
