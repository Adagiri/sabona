# Vendor Service Multilingual Notification Changes

## File: backend/src/modules/app/vendor/vendor.service.ts

### Change 1: Order Accepted - Customer Notification (Line ~242-273)

**REMOVE:**
```typescript
                // Notify customer about acceptance
                if (customerTokens?.length) {
                    const customerAcceptedNotificationData = {
                        tokens: customerTokens,
                        title: 'Order Accepted!',
                        body: 'Your order has been accepted and a driver has been assigned.',
                        notificationData: {
                            orderId: order.id,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        },
                    };

                    const res = await this._notificationService.SendNotificationToMultipleTokens(
                        customerAcceptedNotificationData,
                    );

                    if (res) {
                        await this._dbService.notification.create({
                            data: {
                                orderId: order.id,
                                userId: customer.userId,
                                type: 'ORDER_ACCEPTED',
                                message: 'Your order has been accepted and a driver has been assigned.',
                                status: 'UNREAD',
                                data: {
                                    orderId: order.id,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'TrackOrder',
                                },
                            },
                        });
                    }
                }
```

**REPLACE WITH:**
```typescript
                // Notify customer about acceptance
                if (customer.userId) {
                    await this._notificationService.SendMultilingualNotificationToUser(
                        customer.userId,
                        'ORDER_ACCEPTED',
                        {
                            orderId: order.id,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        },
                    );
                }
```

---

### Change 2: Order Accepted - Driver Notification (Line ~276-314)

**REMOVE:**
```typescript
                // Notify ONLY the assigned driver
                if (driverNotificationTokens?.length) {
                    const driverNotificationData = {
                        tokens: driverNotificationTokens,
                        title: 'New Pickup Assignment!',
                        body: `Order #${order.orderNumber} has been accepted - ${closestDriver.distance}km away from ${order.laundry.name}`,
                        notificationData: {
                            orderId: order.id,
                            key: 'FETCH_ASSIGNED_ORDERS',
                            route: 'AssignedRides',
                        },
                    };

                    const res =
                        await this._notificationService.SendNotificationToMultipleTokens(driverNotificationData);

                    if (res) {
                        await this._dbService.notification.create({
                            data: {
                                userId: closestDriver.riderId,
                                orderId: order.id,
                                message: `New pickup assignment - ${closestDriver.distance}km away from ${order.laundry.name}`,
                                status: 'UNREAD',
                                data: {
                                    orderId: order.id,
                                    key: 'FETCH_ASSIGNED_ORDERS',
                                    route: 'AssignedRides',
                                },
                                type: 'ORDER_ACCEPTED',
                            },
                        });
                        console.log('Driver assigned and notified');
                    } else {
                        console.log('Failed to notify driver');
                    }
                } else {
                    console.log('No driver tokens found');
                }
```

**REPLACE WITH:**
```typescript
                // Notify ONLY the assigned driver
                if (closestDriver.riderId) {
                    await this._notificationService.SendMultilingualNotificationToUser(
                        closestDriver.riderId,
                        'NEW_PICKUP_REQUEST',
                        {
                            orderId: order.id,
                            key: 'FETCH_ASSIGNED_ORDERS',
                            route: 'AssignedRides',
                        },
                    );
                    console.log('Driver assigned and notified');
                } else {
                    console.log('No driver assigned');
                }
```

---

### Change 3: Order Rejected - Customer Notification (Line ~403-442)

**REMOVE:**
```typescript
                // Notify customer about rejection and refund
                const notificationBody = refundProcessed
                    ? 'Your order has been rejected by the vendor and your payment has been refunded.'
                    : 'Your order has been rejected by the vendor';

                const customerOrderRejectedNotificationData = {
                    tokens: customerTokens,
                    title: 'Order Rejected',
                    body: notificationBody,
                    notificationData: {
                        orderId: order.id,
                        key: 'FETCH_ORDERS',
                        route: 'Orders',
                    },
                };

                if (customerTokens?.length) {
                    const res = await this._notificationService.SendNotificationToMultipleTokens(
                        customerOrderRejectedNotificationData,
                    );
                    if (res) {
                        await this._dbService.notification.create({
                            data: {
                                userId: customer.userId,
                                orderId: order.id,
                                message: notificationBody,
                                status: 'UNREAD',
                                data: {
                                    orderId: order.id,
                                    key: 'FETCH_ORDERS',
                                    route: 'Orders',
                                },
                                type: 'ORDER_REJECTED',
                            },
                        });
                        console.log('Customer rejection notification created');
                    } else {
                        console.log('Failed to create notification');
                    }
                }
```

**REPLACE WITH:**
```typescript
                // Notify customer about rejection and refund
                if (customer.userId) {
                    await this._notificationService.SendMultilingualNotificationToUser(
                        customer.userId,
                        'ORDER_REJECTED',
                        {
                            orderId: order.id,
                            key: 'FETCH_ORDERS',
                            route: 'Orders',
                        },
                    );
                    console.log('Customer rejection notification sent');
                }
```

---

### Change 4: Ready for Pickup - Customer Notification (Line ~496-531)

**REMOVE:**
```typescript
                // Notify customer
                if (customerTokens?.length) {
                    const customerReadyForPickupNotificationData = {
                        tokens: customerTokens,
                        title: 'Order Processed!',
                        body: 'Your order is processed and will be delivered soon.',
                        notificationData: {
                            orderId: order.id,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        },
                    };

                    const res = await this._notificationService.SendNotificationToMultipleTokens(
                        customerReadyForPickupNotificationData,
                    );
                    if (res) {
                        await this._dbService.notification.create({
                            data: {
                                userId: customer.userId,
                                orderId: order.id,
                                message: 'Your order is processed and will be delivered soon.',
                                status: 'UNREAD',
                                data: {
                                    orderId: order.id,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'TrackOrder',
                                },
                                type: 'ORDER_PROCESSING',
                            },
                        });
                        console.log('Customer Notification created');
                    } else {
                        console.log('Failed to create notification');
                    }
                }
```

**REPLACE WITH:**
```typescript
                // Notify customer
                if (customer.userId) {
                    await this._notificationService.SendMultilingualNotificationToUser(
                        customer.userId,
                        'ORDER_READY_FOR_PICKUP',
                        {
                            orderId: order.id,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        },
                    );
                    console.log('Customer notification sent');
                }
```

---

### Change 5: Ready for Pickup - Driver Notification (Line ~534-582)

**REMOVE:**
```typescript
                // Notify ONLY the assigned driver
                if (assignedRider) {
                    const assignedDriverTokens = await this._dbService.deviceToken.findMany({
                        where: {
                            userId: assignedRider.riderId,
                            deletedAt: null,
                        },
                        select: { token: true },
                    });

                    const assignedDriverNotificationTokens = extractTokens(assignedDriverTokens);

                    if (assignedDriverNotificationTokens?.length) {
                        const riderReadyForPickupNotificationData = {
                            tokens: assignedDriverNotificationTokens,
                            title: 'Order Ready for Pickup!',
                            body: `Order #${order.orderNumber} is ready for pickup from ${order.laundry.name}`,
                            notificationData: {
                                orderId: order.id,
                                key: 'FETCH_ASSIGNED_ORDERS',
                                route: 'AssignedRides',
                            },
                        };

                        const res = await this._notificationService.SendNotificationToMultipleTokens(
                            riderReadyForPickupNotificationData,
                        );
                        if (res) {
                            await this._dbService.notification.create({
                                data: {
                                    userId: assignedRider.riderId,
                                    orderId: order.id,
                                    message: `Order #${order.orderNumber} is ready for pickup`,
                                    status: 'UNREAD',
                                    data: {
                                        orderId: order.id,
                                        key: 'FETCH_ASSIGNED_ORDERS',
                                        route: 'AssignedRides',
                                    },
                                    type: 'ORDER_PROCESSING',
                                },
                            });
                            console.log('Assigned driver notified');
                        }
                    } else {
                        console.log('No assigned driver tokens found');
                    }
                } else {
                    console.log('No assigned driver found for this order');
                }
```

**REPLACE WITH:**
```typescript
                // Notify ONLY the assigned driver
                if (assignedRider?.riderId) {
                    await this._notificationService.SendMultilingualNotificationToUser(
                        assignedRider.riderId,
                        'NEW_DELIVERY_REQUEST',
                        {
                            orderId: order.id,
                            key: 'FETCH_ASSIGNED_ORDERS',
                            route: 'AssignedRides',
                        },
                    );
                    console.log('Assigned driver notified');
                } else {
                    console.log('No assigned driver found for this order');
                }
```

---

## Summary

- **5 notification points updated**
- **Removed** ~150 lines of hardcoded notification code
- **Added** ~50 lines of multilingual notification code
- **Result**: 100 lines removed, cleaner code, multilingual support

