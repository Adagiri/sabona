# Rider Service Multilingual Notification Changes

## File: backend/src/modules/app/rider/rider.service.ts

### Change 1: Driver Confirmed - Customer Notification (Line ~325-353)

**REMOVE:**
```typescript
                    // Send notifications
                    const customerNotificationData = {
                        tokens: customerTokens,
                        title: 'Driver Confirmed!',
                        body: 'Your assigned driver has confirmed and is on the way',
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        },
                    };

                    if (customerTokens?.length) {
                        await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);

                        await this._dbService.notification.create({
                            data: {
                                userId: customerId.userId,
                                orderId: params.orderId,
                                message: 'Your assigned driver has confirmed and is on the way',
                                status: 'UNREAD',
                                data: {
                                    orderId: params.orderId,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'TrackOrder',
                                },
                                type: 'ORDER_ACCEPTED',
                            },
                        });
                    }
```

**REPLACE WITH:**
```typescript
                    // Send notifications
                    if (customerId?.userId) {
                        await this._notificationService.SendMultilingualNotificationToUser(
                            customerId.userId,
                            'ORDER_ACCEPTED',
                            {
                                orderId: params.orderId,
                                key: 'GET_ORDER_BY_ID',
                                route: 'TrackOrder',
                            },
                        );
                    }
```

---

### Change 2: Driver Confirmed - Vendor Notification (Line ~355-384)

**REMOVE:**
```typescript
                    if (order.orderType === OrderType.REGISTERED_LAUNDRY && vendorTokens?.length) {
                        const vendorNotificationData = {
                            tokens: vendorTokens,
                            title: 'Driver Confirmed!',
                            // body: this.i18n.translate('order.driver_on_way_pickup', { lang: this.locale }),
                            body: 'Driver is on the way to pick up from customer',
                            notificationData: {
                                orderId: params.orderId,
                                key: 'GET_ORDER_BY_ID',
                                route: 'Track',
                            },
                        };

                        await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);

                        await this._dbService.notification.create({
                            data: {
                                userId: vendorId[0].vendorId,
                                orderId: params.orderId,
                                message: 'Driver is on the way to pick up from customer',
                                status: 'UNREAD',
                                data: {
                                    orderId: params.orderId,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'Track',
                                },
                                type: 'ORDER_ACCEPTED',
                            },
                        });
                    }
```

**REPLACE WITH:**
```typescript
                    if (order.orderType === OrderType.REGISTERED_LAUNDRY && vendorId[0]?.vendorId) {
                        await this._notificationService.SendMultilingualNotificationToUser(
                            vendorId[0].vendorId,
                            'ORDER_ACCEPTED',
                            {
                                orderId: params.orderId,
                                key: 'GET_ORDER_BY_ID',
                                route: 'Track',
                            },
                        );
                    }
```

---

### Change 3: Order Picked Up - Customer Notification (Line ~403-434)

**REMOVE:**
```typescript
                    // Send notifications about pickup
                    const customerNotificationData = {
                        tokens: customerTokens,
                        // title: this.i18n.translate('order.picked_up_title', { lang: this.locale }),
                        title: 'Order Picked Up!',
                        body: 'Your order has been picked up by the driver',
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        },
                    };

                    if (customerTokens?.length) {
                        await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);

                        await this._dbService.notification.create({
                            data: {
                                userId: customerId.userId,
                                orderId: params.orderId,
                                message: 'Your order has been picked up by the driver',
                                status: 'UNREAD',
                                data: {
                                    orderId: params.orderId,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'TrackOrder',
                                },
                                type: 'ORDER_PICKED_UP',
                            },
                        });
                    }
```

**REPLACE WITH:**
```typescript
                    // Send notifications about pickup
                    if (customerId?.userId) {
                        await this._notificationService.SendMultilingualNotificationToUser(
                            customerId.userId,
                            'ORDER_PICKED_UP',
                            {
                                orderId: params.orderId,
                                key: 'GET_ORDER_BY_ID',
                                route: 'TrackOrder',
                            },
                        );
                    }
```

---

## Summary

- **3 notification points updated**
- **Removed** ~90 lines of hardcoded notification code
- **Added** ~30 lines of multilingual notification code  
- **Result**: 60 lines removed, cleaner code, multilingual support

---

## IMPORTANT: Remove Unused Imports

After making these changes, remove the following import if no longer used:

```typescript
import { extractTokens } from 'src/helpers/util.helper';
```

This is only needed if you're still using `SendNotificationToMultipleTokens` elsewhere in the file.

