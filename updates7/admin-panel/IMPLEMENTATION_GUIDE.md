# Admin Panel Implementation Guide - Updates7

## Overview
This guide outlines the frontend changes needed for the admin panel to match the backend updates in updates7.

---

## 1. Note Feature Simplification

### Current Behavior:
- Note format includes admin name and timestamp
- Example: `(Admin: John Smith): Order needs review`

### New Behavior:
- Just plain text, no metadata
- Admin can add or edit raw text directly
- No tracking of who added what or when

### UI Changes Required:

#### **Note Editor:**
```jsx
// Before: Complex note system with history
<NoteHistory />
<AddNoteForm adminName={admin.name} />

// After: Simple textarea
<Textarea
  value={order.adminNotes}
  onChange={(e) => setNotes(e.target.value)}
  placeholder="Add notes about this order..."
/>
<Button onClick={saveNotes}>Save Notes</Button>
```

#### **API Call:**
```javascript
// PUT or PATCH /admin/order/:orderId/notes
{
  "notes": "Simple text here" // Just the raw text
}

// Response:
{
  "message": "Admin notes updated successfully",
  "data": {
    "orderId": "order-123",
    "notes": "Simple text here",
    "addedBy": "Admin",
    "addedAt": "2025-12-15T10:30:00Z"
  }
}
```

#### **Note Display:**
- Display `adminNotes` field as-is
- No parsing needed
- Can show as multiline text
- Optional: Show `addedBy` and `addedAt` from response, but NOT in the note text itself

---

## 2. Custom Order Page Restructure

### Current Layout:
```
[Order Info Card]
[Edit Details Button] → Opens Modal with more info
[Action Buttons]
```

### New Layout Required:
```
[Complete Order Info - No Modal]
[Action Buttons: Cancel | Quick Action | Upload Receipt | View Receipt]
```

### Detailed Changes:

#### **A. Remove "Edit Details" Button**
- This button currently only shows information, doesn't edit anything
- Remove it completely from the UI

#### **B. Move Modal Content to Main Page**
Take everything from the "Edit details" modal and display it directly on the main order page.

**Fields to display:**
- Customer Information
  - Name, Phone, Email
  - Pickup Address, Delivery Address
- Custom Laundry Details
  - Laundry Name
  - Laundry Address
  - Description
- Order Status & Timeline
- Payment Information
  - Payment Link
  - Payment Status
  - Invoice URL
- Driver Information (if assigned)
  - Pickup Driver
  - Delivery Driver
- Receipt Information (if uploaded)
  - Vendor Name
  - Amount Paid
  - Payment Method
  - Receipt Image

#### **C. Reorganize Action Buttons**

**Button Placement:**
```jsx
<ButtonGroup>
  <Button variant="danger" onClick={cancelOrder}>
    Cancel Order
  </Button>

  <QuickActionButton
    order={order}
    flow="custom" // Important: Use custom order flow, not regular
  />

  <Dropdown>
    <DropdownItem onClick={openUploadReceipt}>
      Upload Receipt
    </DropdownItem>
    {/* Other actions */}
  </Dropdown>
</ButtonGroup>

{/* Separate section for viewing */}
<DetailsSection>
  {order.customVendorReceipt && (
    <ViewReceiptButton
      receiptUrl={order.customVendorReceipt}
    />
  )}
</DetailsSection>
```

**Quick Action Button Flow (Custom Orders):**
The Quick Action button should follow custom order status flow:
- `PENDING` → "Assign Pickup Driver"
- `ACCEPTED` → "Upload Receipt" (after driver picks up)
- `IN_PROGRESS` → "Waiting for Payment"
- `READY_FOR_PICKUP` → "Assign Delivery Driver"
- `OUT_FOR_DELIVERY` → "Mark as Delivered"

**Button Organization:**
1. **Primary Actions (Top):**
   - Cancel Button
   - Quick Action Button

2. **Secondary Actions (Dropdown/Menu):**
   - Upload Receipt
   - Assign Driver
   - Update Pricing
   - Regenerate Payment Link

3. **View Actions (In Details Section):**
   - View Receipt
   - View Payment Link
   - View Driver Info

---

## 3. Live Link Regeneration

### Current Behavior:
- User clicks "Regenerate Link"
- Page refreshes or user manually reloads to see new link

### New Behavior Required:
- User clicks "Regenerate Link"
- New link appears immediately (live update)
- No page refresh needed

### Implementation:

```jsx
const [paymentLink, setPaymentLink] = useState(order.payTabsInvoiceUrl);
const [isRegenerating, setIsRegenerating] = useState(false);

const handleRegenerateLink = async () => {
  setIsRegenerating(true);

  try {
    const response = await api.post(
      `/admin/custom-order/${orderId}/regenerate-payment-link`
    );

    // Update link immediately
    setPaymentLink(response.data.data.payTabsInvoice.invoiceUrl);

    // Optional: Show success toast
    toast.success('Payment link regenerated successfully');

    // Optional: Update order state if you're using a global store
    updateOrderInStore({
      ...order,
      payTabsInvoiceUrl: response.data.data.payTabsInvoice.invoiceUrl,
      payTabsInvoiceDateCreated: new Date()
    });

  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsRegenerating(false);
  }
};

// In your JSX:
<div>
  <Label>Payment Link:</Label>
  <LinkDisplay href={paymentLink}>
    {paymentLink}
  </LinkDisplay>

  <Button
    onClick={handleRegenerateLink}
    disabled={isRegenerating}
    loading={isRegenerating}
  >
    Regenerate Link
  </Button>
</div>
```

### API Response Structure:
```json
{
  "data": {
    "orderId": "order-123",
    "payTabsInvoice": {
      "invoiceId": "INV-456",
      "invoiceUrl": "https://paytabs.sa/payment/new-link-here"
    }
  },
  "message": "Payment link regenerated successfully and sent to customer"
}
```

### Live Update Strategies:

**Option 1: Local State Update (Recommended)**
```jsx
// Update local component state immediately
setPaymentLink(newLink);
```

**Option 2: Re-fetch Order**
```jsx
// Fetch fresh order data
await refetchOrder();
```

**Option 3: Global State Update**
```jsx
// If using Redux/Context
dispatch(updateOrder({ payTabsInvoiceUrl: newLink }));
```

---

## 4. Notification Handling

### Backend Changes:
All custom order notifications now use multilingual system. The backend automatically sends notifications in the user's preferred language (English or Arabic).

### Frontend Impact:
- **No changes needed** for notification display
- Notifications will arrive in correct language automatically
- If you're displaying notification history, it will already be in the user's language

---

## 5. Testing Checklist

### Note Feature:
- [ ] Can add new note with plain text
- [ ] Can edit existing note
- [ ] Note saves correctly without admin name or timestamp in text
- [ ] Note displays as multiline if needed

### Custom Order Page:
- [ ] "Edit Details" button is removed
- [ ] All modal content is visible on main page
- [ ] Cancel button works
- [ ] Quick Action button follows custom order flow
- [ ] Upload Receipt is in actions dropdown
- [ ] View Receipt is in details section
- [ ] Layout matches regular order page style

### Live Link Regeneration:
- [ ] Click "Regenerate Link" button
- [ ] New link appears immediately
- [ ] No page refresh occurs
- [ ] Loading state shows during regeneration
- [ ] Error handling works correctly
- [ ] Success message appears
- [ ] 20-minute cooldown is enforced

---

## 6. Example Complete Component Structure

```jsx
function CustomOrderDetailPage({ orderId }) {
  const [order, setOrder] = useState(null);
  const [notes, setNotes] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    const response = await api.get(`/custom-order/${orderId}`);
    setOrder(response.data.data);
    setNotes(response.data.data.adminNotes || '');
    setPaymentLink(response.data.data.payTabsInvoiceUrl);
  };

  const handleSaveNotes = async () => {
    await api.patch(`/admin/order/${orderId}/notes`, { notes });
    toast.success('Notes saved');
  };

  const handleRegenerateLink = async () => {
    const response = await api.post(
      `/admin/custom-order/${orderId}/regenerate-payment-link`
    );
    setPaymentLink(response.data.data.payTabsInvoice.invoiceUrl);
    toast.success('Link regenerated');
  };

  return (
    <Container>
      {/* Main Order Information - No Modal */}
      <OrderInfoSection order={order} />

      {/* Action Buttons */}
      <ActionButtons>
        <CancelButton onClick={handleCancel} />
        <QuickActionButton order={order} flow="custom" />
        <ActionsDropdown>
          <UploadReceiptOption />
          <AssignDriverOption />
          <RegenerateLinkOption onClick={handleRegenerateLink} />
        </ActionsDropdown>
      </ActionButtons>

      {/* Payment Link Section */}
      <PaymentLinkSection
        link={paymentLink}
        onRegenerate={handleRegenerateLink}
      />

      {/* Receipt Section */}
      {order.customVendorReceipt && (
        <ReceiptSection receiptUrl={order.customVendorReceipt} />
      )}

      {/* Notes Section */}
      <NotesSection>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
        />
        <SaveButton onClick={handleSaveNotes}>Save Notes</SaveButton>
      </NotesSection>
    </Container>
  );
}
```

---

## 7. API Endpoints Reference

### Note Management:
```
PATCH /admin/order/:orderId/notes
Body: { "notes": "text here" }
```

### Payment Link:
```
POST /admin/custom-order/:orderId/regenerate-payment-link
Response: { data: { payTabsInvoice: { invoiceUrl, invoiceId } } }
```

### Order Details:
```
GET /custom-order/:orderId
Response: { data: { ...order, adminNotes, payTabsInvoiceUrl } }
```

---

## Questions or Issues?
Contact backend team if you need clarification on any endpoints or response structures.
