# Regenerate Payment Link - Replace Displayed Link

## Overview
After regenerating a payment link, the admin panel should automatically replace the currently displayed link with the newly generated one, without requiring a manual refresh.

---

## Current Behavior (Problem)
1. Admin clicks "Regenerate Payment Link"
2. API successfully generates new link
3. Toast shows "Payment link regenerated successfully"
4. **BUT** the displayed link remains the old one
5. Admin must manually refresh the page to see the new link

---

## Expected Behavior (Fix)
1. Admin clicks "Regenerate Payment Link"
2. API successfully generates new link
3. Frontend immediately updates the displayed link
4. Toast shows "Payment link regenerated successfully"
5. New link is visible immediately (no refresh needed)

---

## Implementation

### Backend (Already Working)
The backend endpoint `/admin/custom-order/:orderId/regenerate-payment-link` already returns the new link in the response.

**Response format:**
```typescript
{
  data: {
    invoiceUrl: string;  // NEW payment link
    invoiceId: string;
    transactionRef: string;
  },
  message: string;
}
```

---

### Frontend Changes

#### File: admin-panel/src/hooks/Admin/mutations/customOrders.ts

**Current implementation (Line ~261-284):**
```typescript
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

**Issue**: The hook invalidates queries, which triggers a refetch, BUT the UI might not update immediately due to React Query caching.

**Solution**: Use `setQueryData` to immediately update the cached data with the new link.

**Updated implementation:**
```typescript
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
      // Immediately update the cached order data with new payment link
      queryClient.setQueryData(
        [CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS, orderId],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            payTabsInvoiceUrl: data.data.invoiceUrl,
            payTabsInvoiceDateCreated: new Date().toISOString(),
            payTabsInvoiceId: data.data.invoiceId,
            payTabsTransactionRef: data.data.transactionRef,
          };
        }
      );

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

---

### Alternative Solution (If Response Format is Different)

If the backend response format differs, adjust accordingly:

```typescript
onSuccess: (response, orderId) => {
  // Extract new link from response (adjust based on actual API response)
  const newInvoiceUrl = response.data?.invoiceUrl || response.invoiceUrl;
  const invoiceId = response.data?.invoiceId || response.invoiceId;
  
  queryClient.setQueryData(
    [CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS, orderId],
    (oldData: any) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        payTabsInvoiceUrl: newInvoiceUrl,
        payTabsInvoiceId: invoiceId,
        payTabsInvoiceDateCreated: new Date().toISOString(),
      };
    }
  );

  toast.success('Payment link regenerated and updated!');
},
```

---

## Testing Steps

1. Open custom order details page
2. Note the current payment link URL
3. Click "Regenerate Payment Link"
4. **Verify**: Link displayed immediately changes to new link
5. **Verify**: No page refresh needed
6. **Verify**: Countdown timer resets to 20 minutes
7. Copy new link and verify it works

---

## Benefits
- ✅ Immediate feedback to admin
- ✅ No manual refresh needed
- ✅ Better UX
- ✅ Link is immediately ready to copy and share

---

**Status**: Ready for implementation  
**Priority**: Medium (UX improvement, not critical)  
**Breaking Change**: No
