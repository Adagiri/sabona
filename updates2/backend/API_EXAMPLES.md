# API Examples and Testing Guide

## Quick Testing with cURL

### 1. Update User Language Preference

**English:**
```bash
curl -X PATCH 'http://localhost:3000/v1/user/preferred-language' \
  -H 'Authorization: Bearer YOUR_USER_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "preferredLanguage": "en"
  }'
```

**Arabic:**
```bash
curl -X PATCH 'http://localhost:3000/v1/user/preferred-language' \
  -H 'Authorization: Bearer YOUR_USER_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "preferredLanguage": "ar"
  }'
```

**Expected Response:**
```json
{
  "id": "user-uuid-here",
  "preferredLanguage": "ar",
  "message": "Language preference updated successfully"
}
```

---

### 2. Admin Broadcast - All Users

```bash
curl -X POST 'http://localhost:3000/v1/notification/admin/broadcast' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "titleEn": "System Maintenance",
    "bodyEn": "We will be performing maintenance tonight from 12-2 AM",
    "titleAr": "صيانة النظام",
    "bodyAr": "سنقوم بإجراء صيانة الليلة من 12-2 صباحاً",
    "actionType": "HOME",
    "route": "Home"
  }'
```

**Expected Response:**
```json
{
  "message": "Broadcast notification sent successfully",
  "totalRecipients": 1523,
  "notificationsSent": 1523
}
```

---

### 3. Admin Broadcast - Customers Only

```bash
curl -X POST 'http://localhost:3000/v1/notification/admin/broadcast' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "titleEn": "New Feature Available!",
    "bodyEn": "Check out our new express delivery option",
    "titleAr": "ميزة جديدة متاحة!",
    "bodyAr": "تحقق من خيار التوصيل السريع الجديد",
    "actionType": "ORDERS",
    "route": "Orders",
    "userTypes": ["USER"]
  }'
```

---

### 4. Admin Broadcast - Loyal Customers (5+ Orders)

```bash
curl -X POST 'http://localhost:3000/v1/notification/admin/broadcast' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "titleEn": "Thank You! 🎉",
    "bodyEn": "Thanks for being a loyal customer! Enjoy 15% off your next order",
    "titleAr": "شكراً لك! 🎉",
    "bodyAr": "شكراً لكونك عميلاً مخلصاً! استمتع بخصم 15% على طلبك القادم",
    "actionType": "PROMOTIONS",
    "route": "Promotions",
    "userTypes": ["USER"],
    "minOrderCount": 5
  }'
```

---

### 5. Admin Broadcast - New Users (Registered This Month)

```bash
curl -X POST 'http://localhost:3000/v1/notification/admin/broadcast' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "titleEn": "Welcome Bonus! 🎁",
    "bodyEn": "Get 20% off your first 3 orders!",
    "titleAr": "مكافأة الترحيب! 🎁",
    "bodyAr": "احصل على خصم 20% على أول 3 طلبات!",
    "actionType": "PROMOTIONS",
    "route": "Promotions",
    "userTypes": ["USER"],
    "registrationStartDate": "2024-12-01T00:00:00Z",
    "registrationEndDate": "2024-12-31T23:59:59Z",
    "maxOrderCount": 0
  }'
```

---

### 6. Admin Broadcast - Inactive Customers

```bash
curl -X POST 'http://localhost:3000/v1/notification/admin/broadcast' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "titleEn": "We Miss You! 💙",
    "bodyEn": "Come back and enjoy 25% off!",
    "titleAr": "نحن نفتقدك! 💙",
    "bodyAr": "عد واستمتع بخصم 25%!",
    "actionType": "PROMOTIONS",
    "route": "Promotions",
    "userTypes": ["USER"],
    "registrationStartDate": "2024-01-01T00:00:00Z",
    "registrationEndDate": "2024-06-30T23:59:59Z",
    "maxOrderCount": 2
  }'
```

---

### 7. Admin Broadcast - Vendors

```bash
curl -X POST 'http://localhost:3000/v1/notification/admin/broadcast' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "titleEn": "Important Update",
    "bodyEn": "New payment processing changes effective next week",
    "titleAr": "تحديث مهم",
    "bodyAr": "تغييرات معالجة الدفع الجديدة سارية الأسبوع القادم",
    "actionType": "PROFILE",
    "route": "Settings",
    "userTypes": ["VENDOR"]
  }'
```

---

### 8. Admin Broadcast - Riders

```bash
curl -X POST 'http://localhost:3000/v1/notification/admin/broadcast' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "titleEn": "Bonus Week! 🚗💨",
    "bodyEn": "Complete 50 deliveries this week for a 500 SAR bonus!",
    "titleAr": "أسبوع المكافآت! 🚗💨",
    "bodyAr": "أكمل 50 توصيلة هذا الأسبوع للحصول على مكافأة 500 ريال!",
    "actionType": "ORDERS",
    "route": "Deliveries",
    "userTypes": ["RIDER"]
  }'
```

---

## Testing with Postman

### Collection Setup

1. Create a new Postman collection: "Notification System"

2. Add environment variables:
   - `base_url`: `http://localhost:3000`
   - `admin_token`: Your admin JWT token
   - `user_token`: Your user JWT token

3. Import these requests:

#### Request 1: Update Language Preference
```
Method: PATCH
URL: {{base_url}}/v1/user/preferred-language
Headers:
  Authorization: Bearer {{user_token}}
  Content-Type: application/json
Body (raw JSON):
{
  "preferredLanguage": "ar"
}
```

#### Request 2: Broadcast to All
```
Method: POST
URL: {{base_url}}/v1/notification/admin/broadcast
Headers:
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json
Body (raw JSON):
{
  "titleEn": "Test Notification",
  "bodyEn": "This is a test",
  "titleAr": "إشعار تجريبي",
  "bodyAr": "هذا اختبار"
}
```

---

## JavaScript/TypeScript Examples

### Frontend Integration (React/Next.js)

```typescript
// api/notifications.ts
interface BroadcastRequest {
  titleEn: string;
  bodyEn: string;
  titleAr: string;
  bodyAr: string;
  actionType?: 'ORDERS' | 'PROFILE' | 'HOME' | 'PROMOTIONS';
  route?: string;
  userTypes?: ('USER' | 'VENDOR' | 'RIDER')[];
  registrationStartDate?: string;
  registrationEndDate?: string;
  minOrderCount?: number;
  maxOrderCount?: number;
}

interface BroadcastResponse {
  message: string;
  totalRecipients: number;
  notificationsSent: number;
}

export const sendBroadcastNotification = async (
  data: BroadcastRequest,
  token: string
): Promise<BroadcastResponse> => {
  const response = await fetch('/v1/notification/admin/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

export const updateLanguagePreference = async (
  language: 'en' | 'ar',
  token: string
): Promise<{ id: string; preferredLanguage: string; message: string }> => {
  const response = await fetch('/v1/user/preferred-language', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ preferredLanguage: language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};
```

### Usage in Component

```typescript
// components/BroadcastForm.tsx
import { useState } from 'react';
import { sendBroadcastNotification } from '@/api/notifications';

export const BroadcastForm = () => {
  const [formData, setFormData] = useState({
    titleEn: '',
    bodyEn: '',
    titleAr: '',
    bodyAr: '',
    actionType: '',
    userTypes: [],
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      const response = await sendBroadcastNotification(formData, token);
      setResult(response);

      // Reset form
      setFormData({
        titleEn: '',
        bodyEn: '',
        titleAr: '',
        bodyAr: '',
        actionType: '',
        userTypes: [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields here */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {result && (
        <div className="success-message">
          ✓ Notification sent to {result.totalRecipients} users!
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Notification'}
      </button>
    </form>
  );
};
```

---

## Node.js Backend Integration Example

```typescript
// services/notificationService.ts
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

export class NotificationService {
  private adminToken: string;

  constructor(adminToken: string) {
    this.adminToken = adminToken;
  }

  async sendWelcomeNotificationToNewUsers(startDate: Date, endDate: Date) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/v1/notification/admin/broadcast`,
        {
          titleEn: 'Welcome! 🎉',
          bodyEn: 'Thanks for joining us!',
          titleAr: 'مرحباً! 🎉',
          bodyAr: 'شكراً لانضمامك إلينا!',
          actionType: 'HOME',
          route: 'Home',
          userTypes: ['USER'],
          registrationStartDate: startDate.toISOString(),
          registrationEndDate: endDate.toISOString(),
          maxOrderCount: 0, // Users with 0 orders
        },
        {
          headers: {
            Authorization: `Bearer ${this.adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to send welcome notification:', error.message);
      throw error;
    }
  }

  async sendPromotionToLoyalCustomers(minOrders: number) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/v1/notification/admin/broadcast`,
        {
          titleEn: 'Special Offer Just For You! 🎁',
          bodyEn: 'Enjoy 20% off your next order',
          titleAr: 'عرض خاص لك فقط! 🎁',
          bodyAr: 'استمتع بخصم 20% على طلبك القادم',
          actionType: 'PROMOTIONS',
          route: 'Promotions',
          userTypes: ['USER'],
          minOrderCount: minOrders,
        },
        {
          headers: {
            Authorization: `Bearer ${this.adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to send promotion:', error.message);
      throw error;
    }
  }
}

// Usage
const notificationService = new NotificationService(process.env.ADMIN_TOKEN!);

// Send welcome notification to users registered in the last week
const lastWeek = new Date();
lastWeek.setDate(lastWeek.getDate() - 7);

notificationService.sendWelcomeNotificationToNewUsers(lastWeek, new Date())
  .then(result => {
    console.log(`Sent to ${result.totalRecipients} users`);
  })
  .catch(err => {
    console.error('Error:', err);
  });
```

---

## Mobile App Integration (React Native)

```typescript
// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.yourapp.com';

export const updateUserLanguage = async (language: 'en' | 'ar') => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const response = await fetch(`${API_URL}/v1/user/preferred-language`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ preferredLanguage: language }),
    });

    if (!response.ok) {
      throw new Error('Failed to update language');
    }

    const data = await response.json();

    // Update local storage
    await AsyncStorage.setItem('userLanguage', language);

    return data;
  } catch (error) {
    console.error('Error updating language:', error);
    throw error;
  }
};

// Usage in Settings Screen
import { updateUserLanguage } from './services/api';

const SettingsScreen = () => {
  const [language, setLanguage] = useState('en');

  const handleLanguageChange = async (newLanguage: 'en' | 'ar') => {
    try {
      await updateUserLanguage(newLanguage);
      setLanguage(newLanguage);
      // Update I18n locale
      I18n.locale = newLanguage;
      // Show success message
      Alert.alert('Success', 'Language updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update language');
    }
  };

  return (
    <View>
      <Text>Select Language:</Text>
      <Button
        title="English"
        onPress={() => handleLanguageChange('en')}
      />
      <Button
        title="العربية"
        onPress={() => handleLanguageChange('ar')}
      />
    </View>
  );
};
```

---

## Testing Scenarios

### Scenario 1: Test Language Preference Update
1. User sets language to Arabic
2. Create an order
3. Check admin receives notification (should respect admin's language)
4. User should receive notifications in Arabic from now on

### Scenario 2: Test Broadcast to Filtered Users
1. Create 3 test users: 1 with 0 orders, 1 with 5 orders, 1 with 10 orders
2. Send broadcast with `minOrderCount: 5`
3. Verify only 2 users received the notification

### Scenario 3: Test Bilingual Notifications
1. Set user A to English
2. Set user B to Arabic
3. Send broadcast to both
4. Verify user A receives English version
5. Verify user B receives Arabic version

### Scenario 4: Test Admin Notifications
1. Admin sets language to Arabic
2. Customer creates order
3. Verify admin receives notification in Arabic
4. Admin changes language to English
5. New order created
6. Verify admin receives notification in English

---

## Troubleshooting

### Issue: Notifications not received

**Check:**
1. User has valid device tokens in database
2. User status is ACTIVE
3. User matches filter criteria
4. FCM service is running
5. Check backend logs for errors

### Issue: Wrong language received

**Check:**
1. User's `preferredLanguage` field in database
2. Should be 'en' or 'ar'
3. Falls back to 'en' if null

### Issue: Admin broadcast returns 0 recipients

**Check:**
1. Filters are not too restrictive
2. Users have device tokens
3. Users are ACTIVE status
4. Date range filters are correct

### Issue: 403 Forbidden on broadcast endpoint

**Check:**
1. User has ADMIN role
2. Valid admin token provided
3. Token not expired
