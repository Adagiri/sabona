# Admin Notes - Make Editable (Not Append-Only)

## Overview
Change admin notes from append-only to fully editable. The button should show "Add Note" when no notes exist, and "Edit Note" when notes exist.

---

## Backend Changes

### File: backend/src/modules/app/admin/admin.service.ts

**Find method:** `addOrderNotes` (or similar method that handles notes)

**Change from APPEND mode:**
```typescript
async addOrderNotes(orderId: string, notes: string, adminUser: User): Promise<any> {
    const order = await this._dbService.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new BadRequestException('Order not found');
    }

    // BEFORE: Append notes
    const updatedNotes = order.adminNotes
        ? `${order.adminNotes}\n---\n[${new Date().toISOString()}] ${adminUser.firstName}:\n${notes}`
        : `[${new Date().toISOString()}] ${adminUser.firstName}:\n${notes}`;

    await this._dbService.order.update({
        where: { id: orderId },
        data: { adminNotes: updatedNotes },
    });

    return { message: 'Notes added successfully' };
}
```

**Change to REPLACE mode:**
```typescript
async updateOrderNotes(orderId: string, notes: string, adminUser: User): Promise<any> {
    const order = await this._dbService.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new BadRequestException('Order not found');
    }

    // AFTER: Replace notes entirely
    await this._dbService.order.update({
        where: { id: orderId },
        data: { adminNotes: notes },
    });

    return { message: 'Notes updated successfully' };
}
```

---

## Frontend Changes

### File 1: admin-panel/src/pages/OrderDetails.tsx

**Change 1: Button Label Logic**

Add state to track if notes exist:
```typescript
const hasNotes = orderDetails?.adminNotes && orderDetails.adminNotes.trim().length > 0;
```

**Change 2: Update Button Text**
```typescript
<Button
  variant='contained'
  color='primary'
  startIcon={addOrderNotesMutation.isPending ? null : <Edit />}
  onClick={() => {
    setAdminNotes(orderDetails?.adminNotes || ''); // Pre-fill existing notes
    setNotesDialogOpen(true);
  }}
  disabled={addOrderNotesMutation.isPending}
  fullWidth
>
  {addOrderNotesMutation.isPending ? (
    <>
      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
      Saving...
    </>
  ) : hasNotes ? (
    'Edit Note'  // Changed from "Add Notes"
  ) : (
    'Add Note'
  )}
</Button>
```

**Change 3: Pre-fill Notes in Dialog**
```typescript
// When opening dialog, pre-fill with existing notes
const handleOpenNotesDialog = () => {
  setAdminNotes(orderDetails?.adminNotes || '');
  setNotesDialogOpen(true);
};
```

**Change 4: Update handleSaveNotes**
```typescript
const handleSaveNotes = useCallback(async () => {
  if (!orderId) {
    toast.error('Order ID is missing');
    return;
  }

  // Allow saving empty notes (to clear them)
  try {
    await addOrderNotesMutation.mutateAsync({
      orderId,
      notes: adminNotes, // Send as-is, even if empty
    });
    setNotesDialogOpen(false);
    await refetch(); // Refresh order details
  } catch (error) {
    console.error('Failed to save notes:', error);
  }
}, [orderId, adminNotes, addOrderNotesMutation, refetch]);
```

---

### File 2: admin-panel/src/hooks/Admin/mutations/orders.ts (or customOrders.ts)

**Update mutation hook name and endpoint:**

```typescript
// Rename from useAddOrderNotes to useUpdateOrderNotes
export const useUpdateOrderNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      notes,
    }: {
      orderId: string;
      notes: string;
    }) => {
      const response = await api.patch(
        `/admin/order/${orderId}/notes`,  // or `/admin/custom-order/${orderId}/notes`
        { notes }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ORDER_DETAILS, variables.orderId],
      });
      toast.success('Notes updated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update notes';
      toast.error(message);
    },
  });
};
```

---

## UI Behavior

### Before:
- Button always says "Add Notes"
- Notes are appended with timestamps
- Can't edit existing notes
- Notes keep growing with each update

### After:
- Button says "Add Note" when no notes exist
- Button says "Edit Note" when notes exist
- Clicking opens dialog with existing notes pre-filled
- User can edit/replace entire note content
- Can clear notes by saving empty text

---

## Testing Checklist

- [ ] New order with no notes shows "Add Note" button
- [ ] Clicking "Add Note" opens empty dialog
- [ ] Saving note updates order and shows "Edit Note" button
- [ ] Clicking "Edit Note" opens dialog with existing notes pre-filled
- [ ] Editing and saving replaces the note (doesn't append)
- [ ] Can clear notes by deleting all text and saving
- [ ] Notes persist after page refresh

---

**Status**: Ready for implementation  
**Priority**: High (UX improvement)  
**Breaking Change**: Yes (changes from append to replace mode)
