# CustomOrderDetails.tsx Frontend Changes

## File: admin-panel/src/pages/CustomOrderDetails.tsx

## Overview
Implement contextual action buttons that show only when relevant to the current order state, instead of displaying all buttons at once.

---

## Change 1: Add Helper Function (After imports, before component ~Line 47)

**Add this helper function:**
```typescript
/**
 * Get contextual actions based on order state
 * Returns only the actions that are relevant for the current order status
 */
const getContextualActions = (order: any) => {
  const actions: Array<{
    label: string;
    icon: any;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    disabled?: boolean;
  }> = [];

  // PENDING: Need to assign pickup driver
  if (order.status === 'PENDING') {
    actions.push({
      label: 'Assign Pickup Driver',
      icon: Assignment,
      onClick: () => setDriverDialogOpen(true),
      color: 'primary',
    });
  }

  // IN_PROGRESS: Different actions based on progress
  if (order.status === 'IN_PROGRESS') {
    // Receipt not uploaded yet
    if (!order.customVendorReceipt && !order.customVendorPaid) {
      actions.push({
        label: 'Upload Receipt',
        icon: Upload,
        onClick: () => setReceiptDialogOpen(true),
        color: 'warning',
      });
    }
    
    // Receipt uploaded but customer hasn't paid
    else if (order.customVendorPaid && !order.customerPaid) {
      actions.push({
        label: 'Awaiting Customer Payment',
        icon: Receipt,
        onClick: () => {}, // No action - just showing status
        color: 'info',
        disabled: true,
      });
    }
    
    // Receipt uploaded AND customer paid - ready for delivery assignment
    else if (order.customVendorPaid && order.customerPaid) {
      actions.push({
        label: 'Assign Delivery Driver',
        icon: LocalShipping,
        onClick: () => setDeliveryDriverDialogOpen(true),
        color: 'success',
      });
    }
  }

  // READY_FOR_PICKUP: Show in-transit status
  if (order.status === 'READY_FOR_PICKUP') {
    actions.push({
      label: 'In Transit',
      icon: LocalShipping,
      onClick: () => {}, // No action - just showing status
      color: 'info',
      disabled: true,
    });
  }

  return actions;
};
```

---

## Change 2: Update Action Bar Section (Replace entire Action Bar ~Line 218-260)

**Replace the existing Action Bar section:**
```typescript
      {/* Action Bar */}
      {nextAction && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light' }}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography variant='body1' fontWeight='medium'>
              Next Action Required: {nextAction}
            </Typography>
            <Stack direction='row' spacing={1}>
              {nextAction === 'Assign Pickup Driver' && (
                <Button
                  variant='contained'
                  startIcon={<Assignment />}
                  onClick={() => setDriverDialogOpen(true)}
                >
                  Assign Driver
                </Button>
              )}
              {nextAction === 'Upload Receipt' && (
                <Button
                  variant='contained'
                  startIcon={<Upload />}
                  onClick={() => setReceiptDialogOpen(true)}
                >
                  Upload Receipt
                </Button>
              )}
              {nextAction === 'Assign Delivery Driver' && (
                <Button
                  variant='contained'
                  startIcon={<LocalShipping />}
                  onClick={() => setDeliveryDriverDialogOpen(true)}
                >
                  Assign Delivery Driver
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>
      )}
```

**With this new contextual implementation:**
```typescript
      {/* Contextual Action Bar */}
      {(() => {
        const contextualActions = getContextualActions(order);
        
        if (contextualActions.length === 0) return null;
        
        return (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light' }}>
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
            >
              <Box>
                <Typography variant='body1' fontWeight='bold' color='primary.dark'>
                  {contextualActions[0].disabled 
                    ? 'Current Status' 
                    : 'Action Required'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {contextualActions[0].label}
                </Typography>
              </Box>
              <Stack direction='row' spacing={1}>
                {contextualActions.map((action, index) => (
                  <Button
                    key={index}
                    variant='contained'
                    color={action.color || 'primary'}
                    startIcon={<action.icon />}
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Paper>
        );
      })()}
```

---

## Change 3: Remove getNextAction() Function (Line ~179-194)

**Remove this entire function as it's no longer needed:**
```typescript
  const getNextAction = () => {
    switch (order.status) {
      case 'PENDING':
        return 'Assign Pickup Driver';
      case 'IN_PROGRESS':
        if (!order.customVendorPaid) return 'Upload Receipt';
        if (!order.customerPaid) return 'Awaiting Payment';
        return 'Assign Delivery Driver';
      case 'READY_FOR_PICKUP':
        return 'In Transit';
      default:
        return null;
    }
  };

  const nextAction = getNextAction();
```

---

## Change 4: Update Order Status & Management Section (Line ~287-327)

**Simplify the management actions section:**
```typescript
            {/* Management Actions */}
            <Stack direction='row' spacing={2}>
              <Button
                startIcon={<Edit />}
                onClick={() => setDetailsDialogOpen(true)}
                variant='outlined'
                size='small'
              >
                Edit Details
              </Button>

              <Button
                startIcon={<Receipt />}
                onClick={() => setReceiptDialogOpen(true)}
                variant='outlined'
                size='small'
              >
                View/Upload Receipt
              </Button>

              {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                <Button
                  startIcon={<Cancel />}
                  onClick={() => setCancelDialogOpen(true)}
                  variant='outlined'
                  color='error'
                  size='small'
                >
                  Cancel Order
                </Button>
              )}
            </Stack>
```

**Note:** Remove the "Assign Drivers" button from here since drivers are assigned contextually in the Action Bar.

---

## Summary of Changes

### New Features
1. **Contextual Action Buttons** - Only show relevant actions based on order state
2. **Better Status Display** - Clear indication of current status vs required action
3. **Simplified UI** - No clutter from irrelevant buttons

### Removed Functions
- `getNextAction()` - Replaced with more comprehensive `getContextualActions()`
- `nextAction` variable - No longer needed

### Button Logic Flow

```
PENDING
└─→ "Assign Pickup Driver" (enabled, primary)

IN_PROGRESS
├─→ No receipt: "Upload Receipt" (enabled, warning)
├─→ Receipt uploaded, not paid: "Awaiting Customer Payment" (disabled, info)
└─→ Receipt uploaded, paid: "Assign Delivery Driver" (enabled, success)

READY_FOR_PICKUP
└─→ "In Transit" (disabled, info)

COMPLETED / CANCELLED
└─→ No action buttons shown
```

---

## Testing Checklist

- [ ] PENDING order shows only "Assign Pickup Driver"
- [ ] IN_PROGRESS without receipt shows "Upload Receipt"
- [ ] IN_PROGRESS with receipt but no payment shows "Awaiting Customer Payment" (disabled)
- [ ] IN_PROGRESS with receipt and payment shows "Assign Delivery Driver"
- [ ] READY_FOR_PICKUP shows "In Transit" (disabled)
- [ ] COMPLETED orders show no action buttons
- [ ] CANCELLED orders show no action buttons
- [ ] All buttons trigger correct dialogs
- [ ] Button colors match their purpose (warning for upload, success for delivery, etc.)

---

**Status**: Ready to implement  
**Impact**: High (Better UX, cleaner interface)  
**Breaking Changes**: None (only UI improvements)
