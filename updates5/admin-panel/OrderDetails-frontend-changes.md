# OrderDetails.tsx Frontend Changes

## File: admin-panel/src/pages/OrderDetails.tsx

## Overview
Add loading states to action buttons and display admin notes on the order details page.

---

## Change 1: Import useAddOrderNotes Hook (Line ~59)

**Add this import:**
```typescript
import { useCancelOrder, useAcceptOrder, useAddOrderNotes } from '../hooks/Admin/mutations/customOrders';
```

---

## Change 2: Initialize Mutation Hooks (Line ~81-82)

**Add after existing mutation declarations:**
```typescript
const cancelMutation = useCancelOrder();
const acceptOrderMutation = useAcceptOrder();
const addOrderNotesMutation = useAddOrderNotes(); // ADD THIS LINE
```

---

## Change 3: Add Loading State Variable (After all mutation declarations, ~Line 83)

**Add this variable:**
```typescript
// Track if any mutation is pending
const isAnyMutationPending = 
  acceptOrderMutation.isPending ||
  cancelMutation.isPending ||
  addOrderNotesMutation.isPending;
```

---

## Change 4: Update handleSaveNotes Function (Line ~115-119)

**Replace the existing function:**
```typescript
const handleSaveNotes = useCallback(() => {
  // TODO: Implement API call to save admin notes
  toast.success('Notes saved successfully');
  setNotesDialogOpen(false);
}, []);
```

**With:**
```typescript
const handleSaveNotes = useCallback(async () => {
  if (!orderId || !adminNotes.trim()) {
    toast.error('Please enter some notes');
    return;
  }

  try {
    await addOrderNotesMutation.mutateAsync({
      orderId,
      notes: adminNotes,
    });
    setAdminNotes(''); // Clear the input
    setNotesDialogOpen(false);
    await refetch(); // Refresh order details to show new notes
  } catch (error) {
    console.error('Failed to save notes:', error);
  }
}, [orderId, adminNotes, addOrderNotesMutation, refetch]);
```

---

## Change 5: Add Admin Notes Display Card (After Laundry Information Card, ~Line 410)

**Add this complete Card component:**
```typescript
          {/* Admin Notes */}
          {orderDetails?.adminNotes && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Admin Notes
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'grey.50',
                    p: 2,
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'grey.300',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <Typography
                    variant='body2'
                    sx={{ fontFamily: 'monospace' }}
                  >
                    {orderDetails.adminNotes}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
```

---

## Change 6: Update Accept Order Button (Line ~689-703)

**Replace:**
```typescript
                {orderDetails.status === 'PENDING' && (
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={<CheckCircle />}
                    onClick={handleAcceptOrder}
                    disabled={acceptOrderMutation.isPending}
                    fullWidth
                  >
                    {acceptOrderMutation.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'Accept Order'
                    )}
                  </Button>
                )}
```

**With (add fullWidth and improve loading UI):**
```typescript
                {orderDetails.status === 'PENDING' && (
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={acceptOrderMutation.isPending ? null : <CheckCircle />}
                    onClick={handleAcceptOrder}
                    disabled={acceptOrderMutation.isPending}
                    fullWidth
                  >
                    {acceptOrderMutation.isPending ? (
                      <>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        Accepting...
                      </>
                    ) : (
                      'Accept Order'
                    )}
                  </Button>
                )}
```

---

## Change 7: Update "Add Notes" Button (Line ~667-675)

**Add loading state:**
```typescript
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={addOrderNotesMutation.isPending ? null : <Edit />}
                  onClick={() => setNotesDialogOpen(true)}
                  disabled={addOrderNotesMutation.isPending}
                  fullWidth
                >
                  {addOrderNotesMutation.isPending ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Saving...
                    </>
                  ) : (
                    'Add Notes'
                  )}
                </Button>
```

---

## Change 8: Update Save Notes Button in Dialog (Line ~842-845)

**Replace:**
```typescript
          <Button onClick={handleSaveNotes} variant='contained'>
            Save Notes
          </Button>
```

**With:**
```typescript
          <Button 
            onClick={handleSaveNotes} 
            variant='contained'
            disabled={addOrderNotesMutation.isPending || !adminNotes.trim()}
          >
            {addOrderNotesMutation.isPending ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Save Notes'
            )}
          </Button>
```

---

## Complete Summary of Changes

### Imports
- Added `useAddOrderNotes` import

### State Management
- Added `addOrderNotesMutation` hook
- Added `isAnyMutationPending` variable

### Functions
- Updated `handleSaveNotes` to actually save notes via API

### UI Components
- Added Admin Notes display card
- Updated Accept Order button with better loading UX
- Updated Add Notes button with loading state
- Updated Save Notes dialog button with loading state

---

## Testing Checklist

- [ ] Admin notes are visible when present on order
- [ ] Adding notes works and shows loading state
- [ ] Accept order button shows spinner when loading
- [ ] Notes are appended (not replaced) when saved multiple times
- [ ] Empty notes cannot be saved
- [ ] Order details refresh after saving notes

---

**Status**: Ready to implement  
**Impact**: Medium (UI improvements, no breaking changes)
