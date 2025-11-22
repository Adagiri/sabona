# Admin Panel Implementation Instructions
## Payment Link Regeneration UI Feature

### Overview
This feature adds a user interface for admins to regenerate payment links for custom orders, with:
- Visual countdown timer showing when regeneration is available
- Automatic validation (20-minute requirement)
- Display of payment link creation timestamp
- Disabled state for already-paid orders

### Files to Update

#### 1. Custom Orders Mutations Hook
**File:** `src/hooks/Admin/mutations/customOrders.ts`

**Change:** Add new mutation hook after the `useUpdateCustomOrderNotes` hook (around line 258)

```typescript
// Regenerate payment link for custom order
export const useRegeneratePaymentLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.post(
        `/admin/custom-order/${orderId}/regenerate-payment-link`
      );
      return response.data;
    },
    onSuccess: (data, orderId) => {
      console.log(typeof data);
      queryClient.invalidateQueries({
        queryKey: [CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS, orderId],
      });
      toast.success('Payment link regenerated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to regenerate payment link';
      toast.error(message);
    },
  });
};
```

#### 2. Custom Order Details Page
**File:** `src/pages/CustomOrderDetails.tsx`

**Changes:**

a) **Line 45:** Update imports to include the new hook and icon:
```typescript
import { useCancelCustomOrder, useRegeneratePaymentLink } from '../hooks/Admin/mutations/customOrders';
import { Refresh } from '@mui/icons-material';
```

b) **Line 61:** Add the mutation hook initialization:
```typescript
const regeneratePaymentLinkMutation = useRegeneratePaymentLink();
```

c) **After line 85 (after `handleCancelOrder` function):** Add helper functions:
```typescript
// Check if payment link can be regenerated
const canRegeneratePaymentLink = () => {
  if (!order?.payTabsInvoiceDateCreated || order.customerPaid) {
    return false;
  }

  const now = new Date();
  const linkCreatedAt = new Date(order.payTabsInvoiceDateCreated);
  const timeDifferenceInMinutes = (now.getTime() - linkCreatedAt.getTime()) / (1000 * 60);

  return timeDifferenceInMinutes >= 20;
};

// Get remaining time until regeneration is allowed
const getRemainingTime = () => {
  if (!order?.payTabsInvoiceDateCreated) {
    return 0;
  }

  const now = new Date();
  const linkCreatedAt = new Date(order.payTabsInvoiceDateCreated);
  const timeDifferenceInMinutes = (now.getTime() - linkCreatedAt.getTime()) / (1000 * 60);
  const remainingMinutes = Math.max(0, Math.ceil(20 - timeDifferenceInMinutes));

  return remainingMinutes;
};

const handleRegeneratePaymentLink = async () => {
  if (!canRegeneratePaymentLink()) {
    const remainingMinutes = getRemainingTime();
    toast.error(
      `Payment link can only be regenerated after 20 minutes. Please wait ${remainingMinutes} more minute(s)`
    );
    return;
  }

  try {
    await regeneratePaymentLinkMutation.mutateAsync(orderId!);
  } catch (error) {
    console.error('Failed to regenerate payment link:', error);
  }
};
```

d) **After line 594 (after the "Open" button in the payment invoice section):** Add regenerate button UI:
```tsx
{/* Regenerate Payment Link Button */}
{!order.customerPaid && (
  <Box sx={{ mt: 2 }}>
    <Button
      variant='outlined'
      color='warning'
      onClick={handleRegeneratePaymentLink}
      startIcon={<Refresh />}
      disabled={
        !canRegeneratePaymentLink() ||
        regeneratePaymentLinkMutation.isPending
      }
      fullWidth
    >
      {regeneratePaymentLinkMutation.isPending ? (
        <CircularProgress size={20} />
      ) : canRegeneratePaymentLink() ? (
        'Regenerate Payment Link'
      ) : (
        `Regenerate in ${getRemainingTime()} min`
      )}
    </Button>
    {order.payTabsInvoiceDateCreated && (
      <Typography
        variant='caption'
        color='text.secondary'
        display='block'
        sx={{ mt: 1, textAlign: 'center' }}
      >
        Link created:{' '}
        {new Date(
          order.payTabsInvoiceDateCreated
        ).toLocaleString()}
      </Typography>
    )}
  </Box>
)}
```

### Implementation Steps

1. **Copy files from the updates folder:**
   ```bash
   # From your admin-panel root directory
   cp /path/to/updates/admin-panel/customOrders.ts src/hooks/Admin/mutations/
   cp /path/to/updates/admin-panel/CustomOrderDetails.tsx src/pages/
   ```

2. **Verify dependencies are installed:**
   ```bash
   npm install
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   # Or for production build:
   npm run build
   ```

4. **Test the feature:**
   - Navigate to a custom order with a payment link
   - Verify the "Regenerate in X min" button appears if less than 20 minutes
   - Wait for 20+ minutes or manually test with an old order
   - Click "Regenerate Payment Link" and verify success

### UI Behavior

#### Button States

1. **Disabled (< 20 minutes):**
   - Text: "Regenerate in X min"
   - Color: Warning (outlined)
   - Icon: Refresh
   - Clickable: No

2. **Enabled (≥ 20 minutes):**
   - Text: "Regenerate Payment Link"
   - Color: Warning (outlined)
   - Icon: Refresh
   - Clickable: Yes

3. **Loading:**
   - Shows CircularProgress spinner
   - Disabled during API call

4. **Hidden:**
   - Not shown if payment has been received (`customerPaid: true`)

#### Display Information

- **Link creation timestamp:** Shows below the button in small gray text
- **Format:** "Link created: MM/DD/YYYY, HH:MM:SS AM/PM"
- **Updates:** Automatically updates after successful regeneration

### Testing Checklist

- [ ] Button appears on custom order details page
- [ ] Button shows countdown when less than 20 minutes have passed
- [ ] Button is enabled after 20 minutes
- [ ] Clicking button shows loading state
- [ ] Success toast appears on successful regeneration
- [ ] Error toast appears with appropriate message on failure
- [ ] Payment link creation timestamp is displayed
- [ ] Timestamp updates after regeneration
- [ ] Button is hidden for paid orders
- [ ] Order details refresh after successful regeneration

### TypeScript Types

If you encounter TypeScript errors, ensure your order type includes:

```typescript
interface CustomOrder {
  // ... other fields
  payTabsInvoiceUrl?: string;
  payTabsInvoiceDateCreated?: string; // ISO date string
  customerPaid?: boolean;
  // ... other fields
}
```

### Styling Details

- **Button width:** Full width of container
- **Button color:** Warning (orange/yellow theme)
- **Icon:** Material-UI Refresh icon
- **Timestamp:** Caption size, secondary text color, centered
- **Spacing:** 2 units margin-top for button, 1 unit for timestamp

### Error Handling

The UI handles these error cases:

1. **Payment already received:**
   - Backend returns 400
   - Toast: "Payment has already been received for this order"

2. **Less than 20 minutes:**
   - Backend returns 400
   - Toast: "Payment link can only be regenerated after 20 minutes. Please wait X more minute(s)"

3. **No payment link exists:**
   - Backend returns 400
   - Toast: "No payment link exists for this order"

4. **Network/Server error:**
   - Toast: "Failed to regenerate payment link"

### Notes

- The countdown timer is calculated client-side using the `payTabsInvoiceDateCreated` field
- The button automatically disables during API calls to prevent double-submission
- Query cache is invalidated after successful regeneration to fetch updated data
- All user feedback is provided via toast notifications
- The feature integrates seamlessly with existing custom order workflow
