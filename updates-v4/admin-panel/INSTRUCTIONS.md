# Admin Panel Updates V4 - Implementation Instructions

## 📝 Changes Summary

1. Add loading indicator during drag-and-drop reordering
2. Remove category column from items table (redundant)

---

## Step 1: Add Loading State

**File:** `src/pages/LaundryServiceItems.tsx`

### Change 1: Add CircularProgress Import (line ~30)

**Find:**
```typescript
  Avatar,
} from '@mui/material';
```

**Replace with:**
```typescript
  Avatar,
  CircularProgress,
} from '@mui/material';
```

### Change 2: Add isReordering State (line ~240)

**Find:**
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);
const [localItems, setLocalItems] = useState<ServiceItem[]>([]);
```

**Replace with:**
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);
const [isReordering, setIsReordering] = useState(false);
const [localItems, setLocalItems] = useState<ServiceItem[]>([]);
```

### Change 3: Update handleDragEnd Function (line ~320)

**Find:**
```typescript
// Send to backend (category-scoped)
try {
  const itemIds = reordered.map((item) => item.id);
  await reorderItems({
```

**Replace with:**
```typescript
// Send to backend (category-scoped)
setIsReordering(true);
try {
  const itemIds = reordered.map((item) => item.id);
  await reorderItems({
```

**Then find:**
```typescript
} catch (error: any) {
  toast.error(error?.response?.data?.message || 'Failed to reorder items');
  // Revert on error
  setLocalItems([...filteredItems]);
}
```

**Replace with:**
```typescript
} catch (error: any) {
  toast.error(error?.response?.data?.message || 'Failed to reorder items');
  // Revert on error
  setLocalItems([...filteredItems]);
} finally {
  setIsReordering(false);
}
```

### Change 4: Add Loading Indicator to UI (line ~505)

**Find:**
```typescript
<Typography variant="h4" fontWeight="bold">
  {currentCategory?.nameLocale.en || 'Category'} - Items
</Typography>
<Typography variant="body2" color="text.secondary">
  Manage items for this category (drag to reorder)
</Typography>
```

**Replace with:**
```typescript
<Typography variant="h4" fontWeight="bold">
  {currentCategory?.nameLocale.en || 'Category'} - Items
</Typography>
<Stack direction="row" alignItems="center" spacing={1}>
  <Typography variant="body2" color="text.secondary">
    Manage items for this category (drag to reorder)
  </Typography>
  {isReordering && (
    <CircularProgress size={14} thickness={5} />
  )}
</Stack>
```

---

## Step 2: Remove Category Column

**File:** `src/pages/LaundryServiceItems.tsx`

### Change 1: Remove Category from SortableItemRow Component (line ~168)

**Find:**
```typescript
<TableCell>
  <Typography variant="body1" fontWeight="bold">
    {item.nameLocale.en}
  </Typography>
</TableCell>
<TableCell>
  <Stack direction="row" alignItems="center" spacing={1}>
    {item.category.icon?.media?.path && (
      <Avatar
        src={item.category.icon.media.path}
        sx={{ width: 24, height: 24 }}
        variant="rounded"
      >
        <ImageOutlined fontSize="small" />
      </Avatar>
    )}
    <Chip
      label={item.category.nameLocale.en}
      size="small"
      color="primary"
      variant="outlined"
    />
  </Stack>
</TableCell>
<TableCell>
  <Typography variant="body1">{item.vendorPrice.toFixed(2)} SAR</Typography>
</TableCell>
```

**Replace with:**
```typescript
<TableCell>
  <Typography variant="body1" fontWeight="bold">
    {item.nameLocale.en}
  </Typography>
</TableCell>
<TableCell>
  <Typography variant="body1">{item.vendorPrice.toFixed(2)} SAR</Typography>
</TableCell>
```

### Change 2: Remove Category Header (line ~567)

**Find:**
```typescript
<TableCell>
  <strong>Item Name</strong>
</TableCell>
<TableCell>
  <strong>Category</strong>
</TableCell>
<TableCell>
  <strong>Vendor Price</strong>
</TableCell>
```

**Replace with:**
```typescript
<TableCell>
  <strong>Item Name</strong>
</TableCell>
<TableCell>
  <strong>Vendor Price</strong>
</TableCell>
```

### Change 3: Update Empty State Colspan (line ~609)

**Find:**
```typescript
<TableCell colSpan={8} align="center">
```

**Replace with:**
```typescript
<TableCell colSpan={7} align="center">
```

---

## ✅ Testing

1. **Test Loading Indicator:**
   - Navigate to items page
   - Drag an item to reorder
   - Small spinner (14px) should appear next to subtitle during save
   - Spinner disappears when save completes

2. **Test Category Column Removed:**
   - Items table should show: Order | Item Name | Vendor Price | Platform Price | Express Price | Created | Actions
   - Category column should NOT be visible
   - Category name still visible in breadcrumb and page header

---

## 🚀 Deployment

```bash
git add -A
git commit -m "feat: Add reordering loading indicator and remove category column"
git push origin dev
```

---

## 📌 Notes

- Loading indicator is small (14px) to not distract
- Category info still available in breadcrumb and info card
- Table is cleaner with one less column
