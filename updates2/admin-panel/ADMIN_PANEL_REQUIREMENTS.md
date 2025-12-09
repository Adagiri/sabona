# Admin Panel Updates: Notification Broadcast System

## Overview
The backend now supports sending broadcast notifications to users with filtering capabilities. The admin panel needs to be updated to provide a UI for this functionality.

## New Features Required

### 1. Broadcast Notification Page

#### Location
Create a new page/section: **Communications > Broadcast Notifications** or **Notifications > Send Broadcast**

#### UI Components Needed

##### A. Notification Content Section
**Bilingual Input Fields:**

```
┌─────────────────────────────────────────────────────┐
│ English Version                                     │
├─────────────────────────────────────────────────────┤
│ Title (English) *                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Message (English) *                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │                                                 │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Arabic Version                                      │
├─────────────────────────────────────────────────────┤
│ Title (Arabic) *                                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Message (Arabic) *                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │                                                 │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Fields:**
- Title (English) - Text input (required)
- Message (English) - Textarea (required)
- Title (Arabic) - Text input (required)
- Message (Arabic) - Textarea (required)

**Validation:**
- All 4 fields are required
- Character limits: Title (50 chars), Message (200 chars)

---

##### B. Action Configuration Section

```
┌─────────────────────────────────────────────────────┐
│ Action Configuration (Optional)                     │
├─────────────────────────────────────────────────────┤
│ When user taps notification, take them to:         │
│                                                     │
│ Action Type:                                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Select Action Type ▼]                          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Screen Route:                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Action Type Options:**
- None (default - opens home screen)
- ORDERS - Opens orders list
- PROFILE - Opens user profile
- PROMOTIONS - Opens promotions page
- HOME - Opens home screen

**Screen Route:**
- Text input for custom route name
- Auto-filled based on Action Type selection
- Can be customized if needed

---

##### C. Audience Filter Section

```
┌─────────────────────────────────────────────────────┐
│ Target Audience                                     │
├─────────────────────────────────────────────────────┤
│ ☐ Send to all active users                         │
│                                                     │
│ OR apply filters:                                   │
│                                                     │
│ User Types:                                         │
│ ☐ Customers                                         │
│ ☐ Vendors                                           │
│ ☐ Riders                                            │
│                                                     │
│ Registration Date:                                  │
│ ┌──────────────┐  to  ┌──────────────┐            │
│ │ Start Date   │      │ End Date     │            │
│ └──────────────┘      └──────────────┘            │
│                                                     │
│ Order Count:                                        │
│ ┌──────────────┐  to  ┌──────────────┐            │
│ │ Min Orders   │      │ Max Orders   │            │
│ └──────────────┘      └──────────────┘            │
│                                                     │
│ ⓘ Estimated Recipients: 150 users                  │
└─────────────────────────────────────────────────────┘
```

**Filter Fields:**
1. **Send to All** - Checkbox
   - When checked, disables all other filters
   - Sends to all active users

2. **User Types** - Multi-select checkboxes
   - Customers (USER)
   - Vendors (VENDOR)
   - Riders (RIDER)
   - If none selected, includes all types

3. **Registration Date** - Date range picker
   - Start Date (optional)
   - End Date (optional)
   - Format: YYYY-MM-DD

4. **Order Count** - Number inputs
   - Minimum Orders (optional)
   - Maximum Orders (optional)
   - Only users with orders in this range

5. **Estimated Recipients** - Read-only display
   - Show estimated number of users matching filters
   - Update in real-time as filters change (optional feature)

---

##### D. Preview & Send Section

```
┌─────────────────────────────────────────────────────┐
│ Preview                                             │
├─────────────────────────────────────────────────────┤
│ [English Preview]  [Arabic Preview]                │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🔔  Special Offer                               │ │
│ │     Get 20% off on your next order!            │ │
│ │     Just now                                    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [ Cancel ]                   [ Send Notification ] │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Toggle between English and Arabic preview
- Shows notification as it will appear on mobile
- Cancel button - clears form
- Send button - submits notification

---

### 2. API Integration

#### Endpoint
**POST** `/v1/notification/admin/broadcast`

#### Request Payload

```typescript
interface BroadcastNotificationRequest {
  // Required fields
  titleEn: string;
  bodyEn: string;
  titleAr: string;
  bodyAr: string;

  // Optional fields
  actionType?: 'ORDERS' | 'PROFILE' | 'HOME' | 'PROMOTIONS';
  route?: string;

  // Filters (all optional)
  userTypes?: ('USER' | 'VENDOR' | 'RIDER')[];
  registrationStartDate?: string;  // ISO 8601 format
  registrationEndDate?: string;    // ISO 8601 format
  minOrderCount?: number;
  maxOrderCount?: number;
}
```

#### Example Request

```javascript
const sendBroadcast = async (formData) => {
  const payload = {
    titleEn: formData.titleEn,
    bodyEn: formData.bodyEn,
    titleAr: formData.titleAr,
    bodyAr: formData.bodyAr,
    actionType: formData.actionType || undefined,
    route: formData.route || undefined,
    userTypes: formData.sendToAll ? undefined : formData.userTypes,
    registrationStartDate: formData.registrationStartDate
      ? new Date(formData.registrationStartDate).toISOString()
      : undefined,
    registrationEndDate: formData.registrationEndDate
      ? new Date(formData.registrationEndDate).toISOString()
      : undefined,
    minOrderCount: formData.minOrderCount || undefined,
    maxOrderCount: formData.maxOrderCount || undefined,
  };

  const response = await fetch('/v1/notification/admin/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};
```

#### Response

```typescript
interface BroadcastNotificationResponse {
  message: string;
  totalRecipients: number;
  notificationsSent: number;
}
```

**Success Response:**
```json
{
  "message": "Broadcast notification sent successfully",
  "totalRecipients": 150,
  "notificationsSent": 150
}
```

**No Recipients Response:**
```json
{
  "message": "No users found matching the specified filters",
  "totalRecipients": 0,
  "notificationsSent": 0
}
```

---

### 3. User Interface Flow

#### Step-by-Step User Journey

1. **Admin navigates to Broadcast Notifications page**
   - From sidebar: Communications > Broadcast Notifications

2. **Admin fills in notification content**
   - Enters English title and message
   - Enters Arabic title and message
   - All fields are required

3. **Admin configures action (optional)**
   - Selects action type from dropdown
   - Route field auto-fills based on selection
   - Can customize route if needed

4. **Admin sets target audience**
   - Option 1: Check "Send to all active users"
   - Option 2: Apply filters:
     - Select user types
     - Set registration date range
     - Set order count range
   - System shows estimated recipients (optional)

5. **Admin previews notification**
   - Toggle between English and Arabic preview
   - Sees notification as it will appear on mobile
   - Can go back to edit

6. **Admin sends notification**
   - Clicks "Send Notification" button
   - System shows loading state
   - Success: Shows confirmation with stats
   - Error: Shows error message

7. **Admin sees confirmation**
   ```
   ✓ Notification sent successfully!

   Total Recipients: 150 users
   Notifications Sent: 150

   [ Send Another ]  [ View Dashboard ]
   ```

---

### 4. UI Components & Styling

#### Recommended Components

**React Example:**
```jsx
import { useState } from 'react';
import {
  TextField,
  Select,
  Checkbox,
  Button,
  DatePicker,
  Card,
  Tabs,
  Alert
} from 'your-ui-library';

const BroadcastNotificationPage = () => {
  const [formData, setFormData] = useState({
    titleEn: '',
    bodyEn: '',
    titleAr: '',
    bodyAr: '',
    actionType: '',
    route: '',
    sendToAll: true,
    userTypes: [],
    registrationStartDate: null,
    registrationEndDate: null,
    minOrderCount: null,
    maxOrderCount: null,
  });

  const [preview, setPreview] = useState('en'); // 'en' or 'ar'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await sendBroadcast(formData);
      setResult(response);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="broadcast-page">
      {/* Notification Content Section */}
      <Card title="Notification Content">
        {/* English fields */}
        <TextField
          label="Title (English)"
          required
          value={formData.titleEn}
          onChange={(e) => setFormData({...formData, titleEn: e.target.value})}
        />
        <TextField
          label="Message (English)"
          required
          multiline
          rows={4}
          value={formData.bodyEn}
          onChange={(e) => setFormData({...formData, bodyEn: e.target.value})}
        />

        {/* Arabic fields */}
        <TextField
          label="Title (Arabic)"
          required
          value={formData.titleAr}
          onChange={(e) => setFormData({...formData, titleAr: e.target.value})}
        />
        <TextField
          label="Message (Arabic)"
          required
          multiline
          rows={4}
          value={formData.bodyAr}
          onChange={(e) => setFormData({...formData, bodyAr: e.target.value})}
        />
      </Card>

      {/* Action Configuration Section */}
      <Card title="Action Configuration">
        <Select
          label="Action Type"
          value={formData.actionType}
          onChange={(e) => setFormData({...formData, actionType: e.target.value})}
        >
          <option value="">None</option>
          <option value="ORDERS">Orders</option>
          <option value="PROFILE">Profile</option>
          <option value="PROMOTIONS">Promotions</option>
          <option value="HOME">Home</option>
        </Select>
      </Card>

      {/* Audience Filter Section */}
      <Card title="Target Audience">
        <Checkbox
          label="Send to all active users"
          checked={formData.sendToAll}
          onChange={(e) => setFormData({...formData, sendToAll: e.target.checked})}
        />

        {!formData.sendToAll && (
          <>
            {/* User Types */}
            <div>
              <Checkbox label="Customers" />
              <Checkbox label="Vendors" />
              <Checkbox label="Riders" />
            </div>

            {/* Date Range */}
            <div>
              <DatePicker label="Registration Start Date" />
              <DatePicker label="Registration End Date" />
            </div>

            {/* Order Count */}
            <div>
              <TextField type="number" label="Min Orders" />
              <TextField type="number" label="Max Orders" />
            </div>
          </>
        )}
      </Card>

      {/* Preview Section */}
      <Card title="Preview">
        <Tabs value={preview} onChange={setPreview}>
          <Tab value="en">English</Tab>
          <Tab value="ar">Arabic</Tab>
        </Tabs>

        <div className="notification-preview">
          <div className="notification-card">
            <span className="icon">🔔</span>
            <h4>{preview === 'en' ? formData.titleEn : formData.titleAr}</h4>
            <p>{preview === 'en' ? formData.bodyEn : formData.bodyAr}</p>
            <span className="time">Just now</span>
          </div>
        </div>

        <div className="actions">
          <Button variant="outlined" onClick={() => setFormData({...initialState})}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </Button>
        </div>
      </Card>

      {/* Result */}
      {result && (
        <Alert severity="success">
          ✓ Notification sent successfully!
          <br />
          Total Recipients: {result.totalRecipients} users
          <br />
          Notifications Sent: {result.notificationsSent}
        </Alert>
      )}
    </div>
  );
};
```

---

### 5. Validation Rules

**Frontend Validation:**
```javascript
const validateForm = (formData) => {
  const errors = {};

  // Required fields
  if (!formData.titleEn || formData.titleEn.trim() === '') {
    errors.titleEn = 'English title is required';
  }
  if (!formData.bodyEn || formData.bodyEn.trim() === '') {
    errors.bodyEn = 'English message is required';
  }
  if (!formData.titleAr || formData.titleAr.trim() === '') {
    errors.titleAr = 'Arabic title is required';
  }
  if (!formData.bodyAr || formData.bodyAr.trim() === '') {
    errors.bodyAr = 'Arabic message is required';
  }

  // Length validation
  if (formData.titleEn && formData.titleEn.length > 50) {
    errors.titleEn = 'Title must be 50 characters or less';
  }
  if (formData.bodyEn && formData.bodyEn.length > 200) {
    errors.bodyEn = 'Message must be 200 characters or less';
  }
  if (formData.titleAr && formData.titleAr.length > 50) {
    errors.titleAr = 'Title must be 50 characters or less';
  }
  if (formData.bodyAr && formData.bodyAr.length > 200) {
    errors.bodyAr = 'Message must be 200 characters or less';
  }

  // Date validation
  if (formData.registrationStartDate && formData.registrationEndDate) {
    if (new Date(formData.registrationStartDate) > new Date(formData.registrationEndDate)) {
      errors.registrationEndDate = 'End date must be after start date';
    }
  }

  // Order count validation
  if (formData.minOrderCount !== null && formData.maxOrderCount !== null) {
    if (formData.minOrderCount > formData.maxOrderCount) {
      errors.maxOrderCount = 'Max orders must be greater than min orders';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```

---

### 6. Error Handling

**Common Errors:**

1. **Validation Errors (400)**
```json
{
  "message": "Invalid values for titleEn, bodyEn",
  "errors": {
    "titleEn": "English title is required",
    "bodyEn": "English message is required"
  }
}
```

2. **Authentication Error (401)**
```json
{
  "message": "Unauthorized resource"
}
```

3. **Permission Error (403)**
```json
{
  "message": "Access not allowed"
}
```

4. **Server Error (500)**
```json
{
  "message": "Failed to send broadcast notification: [error details]"
}
```

**Error Display:**
```jsx
{error && (
  <Alert severity="error">
    <strong>Error:</strong> {error.message}
    {error.errors && (
      <ul>
        {Object.entries(error.errors).map(([field, msg]) => (
          <li key={field}>{msg}</li>
        ))}
      </ul>
    )}
  </Alert>
)}
```

---

### 7. Testing Checklist

- [ ] Form accepts valid English and Arabic text
- [ ] All required fields show validation errors when empty
- [ ] Character limits are enforced (50 for title, 200 for message)
- [ ] Action type dropdown populates correctly
- [ ] "Send to all" checkbox disables/enables filters
- [ ] User type checkboxes work correctly
- [ ] Date pickers accept valid dates
- [ ] Date range validation works (start < end)
- [ ] Order count validation works (min < max)
- [ ] Preview toggles between English and Arabic correctly
- [ ] Preview shows notification content accurately
- [ ] Send button shows loading state during API call
- [ ] Success message displays with correct stats
- [ ] Error messages display correctly
- [ ] Cancel button clears form
- [ ] Page is accessible (keyboard navigation, screen readers)
- [ ] Arabic text displays right-to-left correctly
- [ ] Mobile responsive design

---

### 8. Optional Enhancements

1. **Estimated Recipients Counter**
   - Add API endpoint to estimate recipient count
   - Update in real-time as filters change
   - Helps admin know impact before sending

2. **Notification History**
   - Page showing previously sent broadcasts
   - Filter by date, sender, recipient count
   - View notification content and stats

3. **Schedule Notifications**
   - Add date/time picker to schedule for later
   - Queue system for scheduled notifications
   - View/edit/cancel scheduled notifications

4. **Template Library**
   - Save frequently used notifications as templates
   - Quick select from template library
   - Edit template before sending

5. **A/B Testing**
   - Send different versions to different user groups
   - Track open rates and engagement
   - Analytics dashboard

6. **Rich Media Support**
   - Upload images for notifications
   - Add buttons/actions to notifications
   - Support for deep links to specific orders/items

---

## Summary

This admin panel feature allows administrators to:
- Send bilingual push notifications (English & Arabic)
- Target specific user segments with filters
- Include deep links to app screens
- See immediate results and statistics
- Efficiently reach thousands of users

The implementation is straightforward and leverages the existing notification infrastructure while providing powerful targeting capabilities.
